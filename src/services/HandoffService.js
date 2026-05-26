/**
 * HandoffService.js
 * 
 * Serviço centralizado para gerenciar transferência de atendimento
 * Abstrai toda a lógica para que a API e Controllers usem de forma consistente
 */

const instanceManager = require('../core/InstanceManager');

class HandoffService {
    /**
     * Verificar se instância existe e está ativa
     */
    static validarInstancia(userId) {
        if (!instanceManager.instances.has(userId)) {
            return {
                valido: false,
                erro: 'Instância do WhatsApp não está ativa'
            };
        }
        return { valido: true };
    }

    /**
     * Obter dados de uma conversa
     */
    static obterDadosConversa(userId, chatId) {
        const validacao = this.validarInstancia(userId);
        if (!validacao.valido) return { erro: validacao.erro };

        const instance = instanceManager.instances.get(userId);
        const estaSilenciado = instance.silencio.estaSilenciado(chatId);
        const timestamp = instance.silencio.obterTimestamp(chatId);

        return {
            chatId,
            estaSilenciado,
            silenciadoEm: timestamp,
            status: estaSilenciado ? 'HUMANO_ATENDENDO' : 'BOT_ATIVO'
        };
    }

    /**
     * ⏸️ ASSUMIR ATENDIMENTO - Operador pega a conversa
     */
    static assumirAtendimento(userId, chatId) {
        const validacao = this.validarInstancia(userId);
        if (!validacao.valido) {
            return {
                sucesso: false,
                erro: validacao.erro
            };
        }

        try {
            const instance = instanceManager.instances.get(userId);

            // Se já está silenciado, nada a fazer
            if (instance.silencio.estaSilenciado(chatId)) {
                return {
                    sucesso: true,
                    mensagem: `Chat já estava em atendimento humano`,
                    ja_silenciado: true
                };
            }

            // Silenciar (operador assume)
            instance.silencio.silenciarChat(chatId);

            return {
                sucesso: true,
                mensagem: `✅ Você assumiu o atendimento. Bot silenciado para ${chatId}`,
                silenciadoEm: instance.silencio.obterTimestamp(chatId)
            };

        } catch (err) {
            return {
                sucesso: false,
                erro: err.message
            };
        }
    }

    /**
     * 🤖 LIBERAR BOT - Finalizando atendimento humano
     */
    static liberarBot(userId, chatId) {
        const validacao = this.validarInstancia(userId);
        if (!validacao.valido) {
            return {
                sucesso: false,
                erro: validacao.erro
            };
        }

        try {
            const instance = instanceManager.instances.get(userId);

            // Se não está silenciado, já está liberado
            if (!instance.silencio.estaSilenciado(chatId)) {
                return {
                    sucesso: true,
                    mensagem: `Chat já estava com bot ativo`,
                    ja_ativo: true
                };
            }

            // Desilenciar (reativar bot)
            instance.silencio.desilenciarChat(chatId);

            return {
                sucesso: true,
                mensagem: `🤖 Bot reativado para ${chatId}. Atendimento automático retomado.`
            };

        } catch (err) {
            return {
                sucesso: false,
                erro: err.message
            };
        }
    }

    /**
     * 📋 LISTAR todos os chats em atendimento humano
     */
    static listarAtendimentos(userId) {
        const validacao = this.validarInstancia(userId);
        if (!validacao.valido) {
            return {
                sucesso: false,
                erro: validacao.erro
            };
        }

        try {
            const instance = instanceManager.instances.get(userId);
            const chats = instance.silencio.listar();

            return {
                sucesso: true,
                chats,
                total: chats.length
            };

        } catch (err) {
            return {
                sucesso: false,
                erro: err.message
            };
        }
    }

    /**
     * 📊 OBTER ESTADO geral de atendimentos
     */
    static obterEstado(userId) {
        const validacao = this.validarInstancia(userId);
        if (!validacao.valido) {
            return {
                sucesso: false,
                erro: validacao.erro
            };
        }

        try {
            const instance = instanceManager.instances.get(userId);
            const estado = instance.conversationCtrl.obterEstado();

            return {
                sucesso: true,
                ...estado
            };

        } catch (err) {
            return {
                sucesso: false,
                erro: err.message
            };
        }
    }
}

module.exports = HandoffService;
