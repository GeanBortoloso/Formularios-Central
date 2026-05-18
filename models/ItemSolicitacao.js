const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ItemSolicitacao = sequelize.define('ItemSolicitacao', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  solicitacao_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'solicitacoes',
      key: 'id',
    },
  },
  descricao: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  quantidade: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
    },
  },
  unidade: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'un',
  },
  observacao: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'itens_solicitacao',
});

module.exports = ItemSolicitacao;
