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
      isIn: [['EPI', 'MERCADO', 'USO_CONSUMO']],
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
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const raw = this.getDataValue('anexo_url');
      if (!raw) return null;
      try { return JSON.parse(raw); } catch { return [raw]; }
    },
    set(val) {
      if (Array.isArray(val)) {
        this.setDataValue('anexo_url', JSON.stringify(val));
      } else {
        this.setDataValue('anexo_url', val);
      }
    },
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
        
        const lastSolicitacao = await Solicitacao.findOne({
          where: {
            numero_pedido: { [Op.like]: `SOL-${year}-%` }
          },
          order: [['numero_pedido', 'DESC']]
        });
        
        let proximoNumero = 1;
        if (lastSolicitacao) {
          const parts = lastSolicitacao.numero_pedido.split('-');
          proximoNumero = parseInt(parts[2], 10) + 1;
        }
        
        const numero = String(proximoNumero).padStart(4, '0');
        solicitacao.numero_pedido = `SOL-${year}-${numero}`;
      }
    },
  },
});

module.exports = Solicitacao;
