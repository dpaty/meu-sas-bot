require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const session = require('express-session');

// Importação das Rotas
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const configRoutes = require('./routes/config');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

// --- CONFIGURAÇÃO GLOBAL ---

// 🚀 ESSENCIAL: Disponibiliza o Socket.io dentro das rotas (req.app.get('io'))
app.set('io', io);

app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET || 'samara_ai_2026',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 24 horas
}));

// --- MIDDLEWARE DE PROTEÇÃO ---

const checkAuth = (req, res, next) => {
    if (req.session.authenticated) {
        return next();
    }
    
    // 🚀 O SEGREDO: Se o caminho começar com /api, mandamos JSON
    if (req.path.startsWith('/api')) {
        return res.status(401).json({ 
            success: false, 
            error: "Sessão expirada. Por favor, faça login novamente." 
        });
    }
    
    // Se for acesso direto a páginas, aí sim redireciona para o login
    res.redirect('/login.html');
};

// --- DEFINIÇÃO DE ROTAS ---

// 1. Rotas de Autenticação (Login/Logout)
app.use('/auth', authRoutes);

// 2. Rotas de Configuração - PÚBLICAS (sem proteção)
app.use('/api', configRoutes);

// 3. Rotas de API (WhatsApp) - PÚBLICAS (sem proteção)
app.use('/api', apiRoutes);

// 4. Páginas Visuais
app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/login.html'));
});

app.get('/dashboard-v2', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/dashboard-v2.html'));
});

// Rota principal: Se estiver logado vai para o dashboard, se não, login
app.get('/', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/dashboard-v2.html'));
});

// Servir arquivos estáticos (CSS, JS do front)
app.use(express.static(path.join(__dirname, '../public')));

// --- COMUNICAÇÃO EM TEMPO REAL (SOCKET) ---

io.on('connection', (socket) => {
    console.log('[SOCKET] Nova conexão detectada.');

    socket.on('join', (userId) => {
        socket.join(userId);
        console.log(`[SOCKET] Usuário ${userId} entrou na sala.`);
    });

    socket.on('disconnect', () => {
        console.log('[SOCKET] Conexão encerrada.');
    });
});

// --- INICIALIZAÇÃO ---

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║  🚀 SÂMARA AI CORE - SISTEMA MODULAR ONLINE              ║
║  ACESSE: http://localhost:${PORT}                         ║
╚══════════════════════════════════════════════════════════╝
    `);
});