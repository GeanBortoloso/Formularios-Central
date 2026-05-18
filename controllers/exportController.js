const { Solicitacao, ItemSolicitacao } = require('../models');
const { gerarPDF } = require('../templates/pdf-template');

/**
 * Gerar PDF de uma solicitação
 */
const exportarPDF = async (req, res) => {
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

    const data = solicitacao.toJSON();
    const filename = `${data.numero_pedido}.pdf`;

    // Set headers BEFORE generating the PDF stream
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    await gerarPDF(data, res);
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Erro interno ao gerar o PDF.',
        error: error.message,
      });
    }
  }
};

module.exports = { exportarPDF };
