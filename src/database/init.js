const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            groq_key TEXT,
            system_prompt TEXT,
            ai_model TEXT,
            use_ai INTEGER DEFAULT 1
        )
    `);
});

console.log("✅ Banco de Dados Inicializado!");
db.close();