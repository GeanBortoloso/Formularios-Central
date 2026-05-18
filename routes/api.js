const express = require('express');
const router = express.Router();
const multer = require('multer');

// Configure multer to use memory storage
const upload = multer({ storage: multer.memoryStorage() });

const solicitacaoController = require('../controllers/solicitacaoController');
const exportController = require('../controllers/exportController');
const { validarSolicitacao } = require('../middleware/validator');

// Middleware to parse 'itens' from string to array (needed for FormData)
const parseItens = (req, res, next) => {
  if (req.body && req.body.itens && typeof req.body.itens === 'string') {
    try {
      req.body.itens = JSON.parse(req.body.itens);
    } catch (err) {
      return res.status(400).json({ success: false, message: 'Formato inválido para itens.' });
    }
  }
  next();
};

// Solicitações
router.post('/solicitacoes', upload.single('anexo'), parseItens, validarSolicitacao, solicitacaoController.criar);
router.get('/solicitacoes', solicitacaoController.listar);
router.get('/solicitacoes/:id', solicitacaoController.buscar);
router.patch('/solicitacoes/:id/status', solicitacaoController.atualizarStatus);

// Exportação
router.get('/solicitacoes/:id/pdf', exportController.exportarPDF);

module.exports = router;
