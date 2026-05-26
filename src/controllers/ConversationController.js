/**
 * ConversationController.js
 * 
 * Controla o ciclo de vida de cada conversa:
 * - Verifica se bot deve responder
 * - Gerencia silêncio com locks
 * - Prioriza atendimento humano
 * 
 * OBJETIVO: Um ponto único e seguro para decidir se bot responde
 */

class ConversationController {
    constructor(silencio) {
        this.silencio = silencio;
        this.processandoEm = new Map(); // Rastreia processamentos em andamento
    }

    /**
     * ✅ PASSO 1: Verificação crítica antes de processar
     * Retorna true se bot DEVE responder, false caso contrário
     */
    botDeveResponder(chatId) {
        // Se está silenciado = humano atendendo = NÃO responda
        if (this.silencio.estaSilenciado(chatId)) {
            console.log(`[CTRL] ⏸️  Chat ${chatId} está em atendimento humano. Bot bloqueado.`);
            return false;
        }

        return true;
    }

    /**
     * ⏱️ PASSO 2: Verificação se já está processando
     * Evita múltiplas respostas ao mesmo tempo
     */
    jaEstaProcessando(chatId) {
        if (this.processandoEm.has(chatId)) {
            const tempo = Date.now() - this.processandoEm.get(chatId);
            if (tempo < 5000) { // Considera processando por 5 segundos
                console.log(`[CTRL] ⚠️  Chat ${chatId} já em processamento. Ignorando.`);
                return true;
            }
            // Se passou de 5s, remove travamento
            this.processandoEm.delete(chatId);
        }
        return false;
    }

    /**
     * 🔒 PASSO 3: Registrar início de processamento
     */
    marcarProcessando(chatId) {
        this.processandoEm.set(chatId, Date.now());
    }

    /**
     * ✅ PASSO 4: Registrar fim de processamento
     */
    finalizarProcessamento(chatId) {
        this.processandoEm.delete(chatId);
    }

    /**
     * 🎯 PASSO 5: Fluxo completo de decisão
     * Retorna: { podeResponder: boolean, motivo: string }
     */
    avaliarConversa(chatId) {
        // Check 1: Está silenciado?
        if (!this.botDeveResponder(chatId)) {
            return {
                podeResponder: false,
                motivo: 'HUMANO_ATENDENDO'
            };
        }

        // Check 2: Já está processando?
        if (this.jaEstaProcessando(chatId)) {
            return {
                podeResponder: false,
                motivo: 'JA_PROCESSANDO'
            };
        }

        return {
            podeResponder: true,
            motivo: 'OK'
        };
    }

    /**
     * 📊 Debug: Ver estado atual de todos os chats
     */
    obterEstado() {
        const silenciados = this.silencio.listar();
        const processando = Array.from(this.processandoEm.keys());
        
        return {
            chatsEmAtendimentoHumano: silenciados,
            chatsProcessando: processando,
            total: silenciados.length + processando.length
        };
    }
}

module.exports = ConversationController;
