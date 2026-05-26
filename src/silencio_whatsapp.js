/**
 * Silencia o bot por conversa quando o dono responde manualmente no WhatsApp
 * 
 * Funcionalidades:
 * - Rastreia chats em atendimento humano
 * - Persiste dados em arquivo JSON
 * - Detecta palavras-chave de "opt-out" (parar, humano, etc.)
 * - Registra timestamp de quando o bot foi silenciado
 */
const path = require("path");
const fs = require("fs");

function createSilencio(rootDir) {
  const file = path.join(rootDir, "silencio_chats.json");
  const idsMsgBot = new Set();
  let chatsSilenciados = new Map(); // Agora é um Map para guardar data/hora

  function load() {
    try {
      if (fs.existsSync(file)) {
        const d = JSON.parse(fs.readFileSync(file, "utf8"));
        // Compatibilidade: se for array antigo, converte para Map
        if (Array.isArray(d.chats)) {
          chatsSilenciados = new Map(d.chats.map(chat => [chat, new Date().toISOString()]));
        } else if (d.chats && typeof d.chats === 'object') {
          chatsSilenciados = new Map(Object.entries(d.chats));
        }
      }
    } catch (e) {
      console.error("silencio_whatsapp: erro ao carregar", e.message);
      chatsSilenciados = new Map();
    }
  }

  function save() {
    try {
      if (!fs.existsSync(path.dirname(file))) fs.mkdirSync(path.dirname(file), { recursive: true });
      // Converte Map para objeto para JSON
      const chatsObj = {};
      chatsSilenciados.forEach((timestamp, chatId) => {
        chatsObj[chatId] = timestamp;
      });
      fs.writeFileSync(file, JSON.stringify({ chats: chatsObj }, null, 2), "utf8");
    } catch (e) {
      console.error("silencio_whatsapp: erro ao salvar", e.message);
    }
  }

  load();

  return {
    registrarMensagemDoBot: (sentMsg) => {
        if (!sentMsg || !sentMsg.id) return;
        const sid = sentMsg.id._serialized || sentMsg.id.id;
        if (sid) idsMsgBot.add(sid);
    },
    ehMensagemDoBot: (msg) => {
        if (!msg || !msg.id) return false;
        const sid = msg.id._serialized || msg.id.id;
        return !!(sid && idsMsgBot.has(sid));
    },
    silenciarChat: (chatId) => {
        if (!chatId || chatsSilenciados.has(chatId)) return;
        const timestamp = new Date().toISOString();
        chatsSilenciados.set(chatId, timestamp);
        save();
        console.log(`🤫 Bot silenciado para: ${chatId} (${timestamp})`);
    },
    desilenciarChat: (chatId) => {
        if (!chatId) return;
        const tinha = chatsSilenciados.has(chatId);
        chatsSilenciados.delete(chatId);
        if (tinha) {
            save();
            console.log(`🤖 Bot reativado para: ${chatId}`);
        }
    },
    estaSilenciado: (chatId) => !!chatId && chatsSilenciados.has(chatId),
    listar: () => {
        // Retorna array com info de chat e timestamp
        return Array.from(chatsSilenciados.entries()).map(([chatId, timestamp]) => ({
            chatId,
            silenciadoEm: timestamp
        }));
    },
    obterTimestamp: (chatId) => chatsSilenciados.get(chatId) || null,
    textoEhOptOut: (texto) => {
        const t = (texto || "").trim().toLowerCase();
        const opt = [/parar/, /stop/, /humano/, /atendente/, /suporte/];
        return opt.some((re) => re.test(t));
    },
    reload: load,
  };
}

module.exports = { createSilencio };