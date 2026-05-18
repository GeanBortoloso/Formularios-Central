const sequelize = require('../config/database');
const Solicitacao = require('./Solicitacao');
const ItemSolicitacao = require('./ItemSolicitacao');

// Define relationships
Solicitacao.hasMany(ItemSolicitacao, {
  foreignKey: 'solicitacao_id',
  as: 'itens',
  onDelete: 'CASCADE',
});

ItemSolicitacao.belongsTo(Solicitacao, {
  foreignKey: 'solicitacao_id',
  as: 'solicitacao',
});

// Sync database
const syncDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexão com o banco de dados estabelecida.');
    await sequelize.sync();
    console.log('✅ Modelos sincronizados com o banco de dados.');
  } catch (error) {
    console.error('❌ Erro ao conectar ao banco de dados:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  Solicitacao,
  ItemSolicitacao,
  syncDatabase,
};
