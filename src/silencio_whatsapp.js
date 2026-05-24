/**
 * Silencia o bot por conversa quando o dono responde manualmente no WhatsApp
 */
const path = require("path");
const fs = require("fs");

function createSilencio(rootDir) {
  const file = path.join(rootDir, "silencio_chats.json");
  const idsMsgBot = new Set();
  let chatsSilenciados = new Set();

  function load() {
    try {
      if (fs.existsSync(file)) {
        const d = JSON.parse(fs.readFileSync(file, "utf8"));
        chatsSilenciados = new Set(Array.isArray(d.chats) ? d.chats : []);
      }
    } catch (e) {
      chatsSilenciados = new Set();
    }
  }

  function save() {
    try {
      if (!fs.existsSync(path.dirname(file))) fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, JSON.stringify({ chats: [...chatsSilenciados] }, null, 2), "utf8");
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
        chatsSilenciados.add(chatId);
        save();
        console.log("🤫 Bot silenciado para:", chatId);
    },
    desilenciarChat: (chatId) => {
        if (!chatId) return;
        chatsSilenciados.delete(chatId);
        save();
    },
    estaSilenciado: (chatId) => !!(chatId && chatsSilenciados.has(chatId)),
    listar: () => [...chatsSilenciados],
    textoEhOptOut: (texto) => {
        const t = (texto || "").trim().toLowerCase();
        const opt = [/parar/, /stop/, /humano/, /atendente/];
        return opt.some((re) => re.test(t));
    },
    reload: load,
  };
}

module.exports = { createSilencio };