class WhatsAppService {
    // Função para formatar o número padrão Brasil (adicionando @c.us)
    formatNumber(number) {
        if (!number.endsWith('@c.us') && !number.endsWith('@g.us')) {
            return `${number}@c.us`;
        }
        return number;
    }

    // Função simples para logar status no terminal de forma bonita
    logStatus(userId, message) {
        console.log(`[WA-SERVICE][${userId}] ${message}`);
    }
}

module.exports = new WhatsAppService();