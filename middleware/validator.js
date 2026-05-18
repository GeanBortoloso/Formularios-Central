/**
 * Middleware de validação para os dados da solicitação
 */
const validarSolicitacao = (req, res, next) => {
  const { tipo, solicitante, setor, itens } = req.body;
  const errors = [];

  // Validar campos obrigatórios
  if (!tipo || !['EPI', 'MERCADO', 'USO_CONSUMO'].includes(tipo)) {
    errors.push('Tipo de solicitação inválido. Use: EPI, MERCADO ou USO_CONSUMO.');
  }

  if (!solicitante || solicitante.trim().length < 3) {
    errors.push('Nome do solicitante é obrigatório (mínimo 3 caracteres).');
  }

  if (!setor || setor.trim().length < 2) {
    errors.push('Setor é obrigatório (mínimo 2 caracteres).');
  }

  // Validar itens
  if (!itens || !Array.isArray(itens) || itens.length === 0) {
    errors.push('É necessário incluir pelo menos um item na solicitação.');
  } else {
    itens.forEach((item, index) => {
      if (!item.descricao || item.descricao.trim().length === 0) {
        errors.push(`Item ${index + 1}: descrição é obrigatória.`);
      }
      if (!item.quantidade || item.quantidade < 1) {
        errors.push(`Item ${index + 1}: quantidade deve ser pelo menos 1.`);
      }
      if (!item.unidade || item.unidade.trim().length === 0) {
        errors.push(`Item ${index + 1}: unidade é obrigatória.`);
      }
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Erro de validação',
      errors,
    });
  }

  next();
};

module.exports = { validarSolicitacao };
