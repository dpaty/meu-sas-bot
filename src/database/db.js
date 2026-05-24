const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '../../database.sqlite');
const db = new sqlite3.Database(dbPath);

// Criar tabelas se não existirem
db.serialize(() => {
    // Tabela de Usuários Evoluída para SaaS Profissional
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        
        -- Informações da Empresa
        company_name TEXT,
        business_segment TEXT,
        system_prompt TEXT,
        
        -- Personalidade da IA
        personality_type TEXT DEFAULT 'professional',
        ai_name TEXT,
        
        -- Blocos de Conhecimento Estruturado
        catalog_prices TEXT,
        faq_data TEXT,
        uploaded_context TEXT,
        extra_details TEXT,
        
        -- Controle de Isca Gratuita / SaaS
        plan_type TEXT DEFAULT 'trial',
        plan_limit INTEGER DEFAULT 300,
        used_messages INTEGER DEFAULT 0,
        expires_at DATETIME,
        
        -- Legado (compatível com versão anterior)
        groq_key TEXT,
        ai_model TEXT,
        use_ai INTEGER DEFAULT 1
    )`);

    // Tabela de Mensagens
    db.run(`CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender TEXT,
        text TEXT,
        response TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

// --- USUÁRIOS ---

const saveUser = (userData) => {
    return new Promise((resolve, reject) => {
        const {
            id, company_name, business_segment, system_prompt,
            personality_type, ai_name,
            catalog_prices, faq_data, uploaded_context, extra_details,
            plan_type, plan_limit, expires_at,
            groq_key, ai_model, use_ai
        } = userData;
        
        db.run(
            `INSERT OR REPLACE INTO users (
                id, company_name, business_segment, system_prompt,
                personality_type, ai_name,
                catalog_prices, faq_data, uploaded_context, extra_details,
                plan_type, plan_limit, expires_at,
                groq_key, ai_model, use_ai
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id, company_name, business_segment, system_prompt,
                personality_type, ai_name,
                catalog_prices, faq_data, uploaded_context, extra_details,
                plan_type, plan_limit, expires_at,
                groq_key, ai_model, use_ai
            ],
            (err) => err ? reject(err) : resolve()
        );
    });
};

// ✅ FUNÇÃO QUE FALTAVA — usada pelo InstanceManager para buscar config do usuário
const getUser = (id) => {
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM users WHERE id = ?`, [id], (err, row) => {
            err ? reject(err) : resolve(row);
        });
    });
};

// --- MENSAGENS ---

const saveMessage = (sender, text, response) => {
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO messages (sender, text, response) VALUES (?, ?, ?)`,
            [sender, text, response],
            (err) => err ? reject(err) : resolve()
        );
    });
};

const getMessages = () => {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT * FROM messages ORDER BY created_at DESC LIMIT 20`,
            [],
            (err, rows) => err ? reject(err) : resolve(rows)
        );
    });
};

// Incrementar o contador de mensagens do cliente (Taxímetro)
const incrementMessageCounter = (id) => {
    return new Promise((resolve, reject) => {
        db.run(
            `UPDATE users SET used_messages = used_messages + 1 WHERE id = ?`,
            [id],
            (err) => err ? reject(err) : resolve()
        );
    });
};

module.exports = { saveUser, getUser, saveMessage, getMessages, incrementMessageCounter };