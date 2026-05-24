const { Client, LocalAuth } = require('whatsapp-web.js');
const { createSilencio } = require('../silencio_whatsapp');
const db = require('../database/db');
const aiService = require('../services/aiService');
const path = require('path');
const fs = require('fs');

class InstanceManager {
    constructor() {
        // Mapa para gerenciar múltiplas conexões simultâneas
        this.instances = new Map();
    }

    /**
     * Inicializa uma instância do WhatsApp para um usuário específico
     * @param {string} userId - ID único do cliente no SaaS
     * @param {object} io - Instância do Socket.io para comunicação em tempo real
     */
    async initUser(userId, io) {
        // Se a instância já existe e está conectada, não faz nada
        if (this.instances.has(userId) && this.instances.get(userId).status === 'connected') {
            return this.instances.get(userId);
        }

        console.log(`[MANAGER] Iniciando motor para o usuário: ${userId}`);

        // Define caminhos no Disco E: para preservar o Disco C: 
        const baseDir = 'E:/dior_/meu-saas-bot';
        const userDataDir = path.join(baseDir, 'data', userId);
        const authPath = path.join(baseDir, '.wwebjs_auth');

        // Cria as pastas se não existirem
        if (!fs.existsSync(userDataDir)) fs.mkdirSync(userDataDir, { recursive: true });

        const client = new Client({
            authStrategy: new LocalAuth({ 
                clientId: userId, 
                dataPath: authPath 
            }),
            puppeteer: {
                // Utiliza o Chrome já instalado no Windows para economizar espaço 
                executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ]
            }
        });

        // Inicializa a lógica de silêncio (atendimento humano) para este usuário
        const silencio = createSilencio(userDataDir);

        // ✅ Auto-configura o usuário com os valores do .env se ainda não tiver config no banco
        const existingConfig = await db.getUser(userId).catch(() => null);
        if (!existingConfig) {
            const geminiKey = process.env.MASTER_GEMINI_KEY;
            const systemPrompt = process.env.SYSTEM_PROMPT || 'Você é um assistente virtual prestativo.';
            if (geminiKey && geminiKey !== 'cole_sua_chave_aqui') {
                await db.saveUser({
                    id: userId,
                    groq_key: geminiKey,
                    system_prompt: systemPrompt,
                    ai_model: 'gemini-3-flash-preview',
                    use_ai: 1
                }).catch(err => console.error(`[DB] Erro ao salvar config padrão: ${err.message}`));
                console.log(`[MANAGER] Config do .env aplicada para o usuário: ${userId}`);
            } else {
                console.warn(`[MANAGER] ⚠️ MASTER_GEMINI_KEY não configurada no .env! O bot não responderá mensagens.`);
            }
        }

        // --- EVENTOS DO CLIENTE ---

        client.on('qr', (qr) => {
            console.log(`[QR CODE] Gerado para o usuário: ${userId}`);
            // Envia o QR apenas para a sala privada do usuário [cite: 2]
            io.to(userId).emit('qr', qr);
        });

        client.on('ready', () => {
            console.log(`[READY] Cliente ${userId} está online!`);
            this.instances.set(userId, { client, status: 'connected', silencio });
            io.to(userId).emit('status', { conectado: true, mensagem: "WhatsApp Conectado com Sucesso!" });
        });

        client.on('message', async (msg) => {
            await this.handleIncomingMessage(userId, msg, client, silencio);
        });

        client.on('disconnected', (reason) => {
            console.log(`[DISCONNECT] Usuário ${userId} saiu: ${reason}`);
            this.instances.delete(userId);
            io.to(userId).emit('status', { conectado: false, mensagem: "WhatsApp Desconectado." });
        });

        // Adiciona ao mapa e inicializa
        this.instances.set(userId, { client, status: 'initializing', silencio });
        
        try {
            await client.initialize();
        } catch (err) {
            console.error(`[INIT ERROR] Falha ao iniciar cliente ${userId}:`, err);
            this.instances.delete(userId);
        }
    }

    /**
     * Lógica de processamento de mensagens com IA e Silêncio
     */
    async handleIncomingMessage(userId, msg, client, silencio) {
        try {
            // Diagnóstico inicial: ignora status, grupos e mensagens próprias [cite: 2]
            if (msg.fromMe || msg.isGroup || msg.isStatus) {
                if (msg.fromMe) silencio.registrarMensagemDoBot(msg);
                return;
            }

            const chatId = msg.from;

            // 1. Verifica se a conversa está em modo 'Humano' 
            if (silencio.estaSilenciado(chatId)) {
                return;
            }

            // 2. Busca configurações do cliente no Banco de Dados
            const userConfig = await db.getUser(userId);
            if (!userConfig || !userConfig.groq_key || !userConfig.use_ai) {
                console.log(`[MANAGER] Usuário ${userId} sem configuração ou IA desativada. Ignorando.`);
                return;
            }

            // 3. Verifica palavras de parada (Opt-out)
            if (silencio.textoEhOptOut(msg.body)) {
                silencio.silenciarChat(chatId);
                const reply = await msg.reply("Pausamos o atendimento automático. Um atendente humano falará com você em breve.");
                silencio.registrarMensagemDoBot(reply);
                return;
            }

            // 4. Interface Humana: Mostra "Digitando..." no WhatsApp
            const chat = await msg.getChat();
            await chat.sendStateTyping();

            // 5. Processamento pela IA com Memória de Contexto
            const response = await aiService.getResponse(userId, chatId, msg.body, userConfig);

            // 6. Resposta Final
            const sentMsg = await msg.reply(response);
            silencio.registrarMensagemDoBot(sentMsg);

            // ✅ 7. Salvar conversa no banco para aparecer no Dashboard
            db.saveMessage(chatId, msg.body, response).catch(err => {
                console.error(`[DB] Erro ao salvar mensagem do usuário ${userId}:`, err.message);
            });

        } catch (error) {
            console.error(`[MESSAGE ERROR] Usuário ${userId}:`, error);
        }
    }
}

module.exports = new InstanceManager();