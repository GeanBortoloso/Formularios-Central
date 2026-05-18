const { Solicitacao, ItemSolicitacao, sequelize } = require('../models');
const { Op } = require('sequelize');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Criar nova solicitação com itens (dentro de uma transação)
 */
const criar = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { tipo, solicitante, setor, justificativa, itens } = req.body;
    let anexoUrls = [];

    // Handle multiple file uploads to Supabase
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const fileExt = path.extname(file.originalname);
        const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExt}`;
        const { data, error } = await supabase.storage
          .from('anexos')
          .upload(fileName, file.buffer, {
            contentType: file.mimetype,
          });

        if (error) {
          console.error('Erro no upload para Supabase:', error);
          throw new Error('Erro ao fazer upload do anexo.');
        }

        const { data: publicUrlData } = supabase.storage
          .from('anexos')
          .getPublicUrl(fileName);

        anexoUrls.push(publicUrlData.publicUrl);
      }
    }

    // Criar a solicitação
    const solicitacao = await Solicitacao.create(
      {
        tipo,
        solicitante: solicitante.trim(),
        setor: setor.trim(),
        justificativa: justificativa ? justificativa.trim() : null,
        anexo_url: anexoUrls.length > 0 ? anexoUrls : null,
      },
      { transaction }
    );

    // Criar os itens
    const itensData = itens.map((item) => ({
      solicitacao_id: solicitacao.id,
      descricao: item.descricao.trim(),
      quantidade: parseInt(item.quantidade, 10),
      unidade: item.unidade.trim(),
      observacao: item.observacao ? item.observacao.trim() : null,
    }));

    await ItemSolicitacao.bulkCreate(itensData, { transaction });

    await transaction.commit();

    // Buscar a solicitação completa com itens
    const solicitacaoCompleta = await Solicitacao.findByPk(solicitacao.id, {
      include: [{ model: ItemSolicitacao, as: 'itens' }],
    });

    res.status(201).json({
      success: true,
      message: 'Solicitação criada com sucesso!',
      data: solicitacaoCompleta,
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Erro ao criar solicitação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno ao criar solicitação.',
      error: error.message,
    });
  }
};

/**
 * Listar solicitações com filtros opcionais
 */
const listar = async (req, res) => {
  try {
    const { tipo, status, data_inicio, data_fim, page = 1, limit = 20 } = req.query;

    const where = {};

    if (tipo) where.tipo = tipo;
    if (status) where.status = status;
    if (data_inicio || data_fim) {
      where.created_at = {};
      if (data_inicio) where.created_at[Op.gte] = new Date(data_inicio);
      if (data_fim) where.created_at[Op.lte] = new Date(data_fim + 'T23:59:59');
    }

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const { count, rows } = await Solicitacao.findAndCountAll({
      where,
      include: [{ model: ItemSolicitacao, as: 'itens' }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit, 10),
      offset,
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(count / parseInt(limit, 10)),
      },
    });
  } catch (error) {
    console.error('Erro ao listar solicitações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno ao listar solicitações.',
      error: error.message,
    });
  }
};

/**
 * Buscar solicitação por ID
 */
const buscar = async (req, res) => {
  try {
    const { id } = req.params;

    const solicitacao = await Solicitacao.findByPk(id, {
      include: [{ model: ItemSolicitacao, as: 'itens' }],
    });

    if (!solicitacao) {
      return res.status(404).json({
        success: false,
        message: 'Solicitação não encontrada.',
      });
    }

    res.json({
      success: true,
      data: solicitacao,
    });
  } catch (error) {
    console.error('Erro ao buscar solicitação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno ao buscar solicitação.',
      error: error.message,
    });
  }
};

/**
 * Atualizar status da solicitação
 */
const atualizarStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['PENDENTE', 'APROVADO', 'RECUSADO'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status inválido. Use: PENDENTE, APROVADO ou RECUSADO.',
      });
    }

    const solicitacao = await Solicitacao.findByPk(id);

    if (!solicitacao) {
      return res.status(404).json({
        success: false,
        message: 'Solicitação não encontrada.',
      });
    }

    solicitacao.status = status;
    await solicitacao.save();

    res.json({
      success: true,
      message: 'Status atualizado com sucesso!',
      data: solicitacao,
    });
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno ao atualizar status.',
      error: error.message,
    });
  }
};

module.exports = { criar, listar, buscar, atualizarStatus };
