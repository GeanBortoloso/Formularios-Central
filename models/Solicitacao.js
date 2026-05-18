const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Solicitacao = sequelize.define('Solicitacao', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  numero_pedido: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },
  tipo: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      isIn: [['EPI', 'LIMPEZA', 'USO_CONSUMO']],
    },
  },
  solicitante: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  setor: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  justificativa: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  anexo_url: {
    type: DataTypes.STRING(1024),
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'PENDENTE',
    validate: {
      isIn: [['PENDENTE', 'APROVADO', 'RECUSADO']],
    },
  },
}, {
  tableName: 'solicitacoes',
  hooks: {
    beforeValidate: async (solicitacao) => {
      if (!solicitacao.numero_pedido) {
        const year = new Date().getFullYear();
        const { Op } = require('sequelize');
        const startOfYear = new Date(`${year}-01-01T00:00:00Z`);
        const count = await Solicitacao.count({
          where: {
            created_at: { [Op.gte]: startOfYear },
          },
        });
        const numero = String(count + 1).padStart(4, '0');
        solicitacao.numero_pedido = `SOL-${year}-${numero}`;
      }
    },
  },
});

module.exports = Solicitacao;
