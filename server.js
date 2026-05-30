require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const apiRoutes = require('./routes/api');
const { syncDatabase } = require('./models');

const app = express();
const PORT = process.env.PORT || 3000;

// Garantir que a pasta database existe
const dbDir = path.join(__dirname, 'database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rotas da API
app.use('/api', apiRoutes);

// Rota leve exclusiva para manter a aplicação acordada (UptimeRobot)
app.get('/ping', (req, res) => {
  res.status(200).send('Servidor ativo!');
});

// Rota fallback para SPA (retorna index.html)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Inicializar
const start = async () => {
  try {
    await syncDatabase();
    app.listen(PORT, () => {
      console.log(`\n🚀 Servidor rodando em http://localhost:${PORT}`);
      console.log(`📋 API disponível em http://localhost:${PORT}/api`);
      console.log(`🏢 ${process.env.COMPANY_NAME || 'Central Peças e Baterias'}\n`);
    });
  } catch (error) {
    console.error('❌ Falha ao iniciar o servidor:', error);
    process.exit(1);
  }
};

start();
