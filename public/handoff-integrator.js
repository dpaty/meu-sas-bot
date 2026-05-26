/**
 * handoff-integrator.js
 * 
 * Integração simples de handoff no seu dashboard
 * Copie este código para seu dashboard-v2.html
 * 
 * Uso:
 * <script src="handoff-integrator.js"></script>
 * <script>
 *   const handoff = new HandoffIntegrator('seu_user_id');
 *   await handoff.atualizarUI();
 * </script>
 */

class HandoffIntegrator {
    constructor(userId) {
        this.userId = userId;
    }

    /**
     * Assumir atendimento de um chat
     */
    async assumir(chatId) {
        try {
            const res = await fetch(`/api/handoff/silenciar/${this.userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chatId })
            });

            const data = await res.json();
            if (data.success) {
                this.mostrarNotificacao(`✅ Você assumiu: ${chatId}`, 'sucesso');
                return true;
            } else {
                this.mostrarNotificacao(`❌ ${data.message}`, 'erro');
                return false;
            }
        } catch (err) {
            this.mostrarNotificacao('❌ Erro ao assumir', 'erro');
            console.error(err);
            return false;
        }
    }

    /**
     * Liberar bot
     */
    async liberar(chatId) {
        try {
            const res = await fetch(`/api/handoff/desilenciar/${this.userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chatId })
            });

            const data = await res.json();
            if (data.success) {
                this.mostrarNotificacao(`🤖 Bot reativado: ${chatId}`, 'sucesso');
                return true;
            } else {
                this.mostrarNotificacao(`❌ ${data.message}`, 'erro');
                return false;
            }
        } catch (err) {
            this.mostrarNotificacao('❌ Erro ao liberar', 'erro');
            console.error(err);
            return false;
        }
    }

    /**
     * Verificar status de um chat
     */
    async verificarStatus(chatId) {
        try {
            const res = await fetch(`/api/handoff/status/${this.userId}/${chatId}`);
            const data = await res.json();
            
            if (data.success) {
                return {
                    estaSilenciado: data.estaSilenciado,
                    status: data.status
                };
            }
            return null;
        } catch (err) {
            console.error('Erro ao verificar status:', err);
            return null;
        }
    }

    /**
     * Listar todos os chats em atendimento
     */
    async listarAtendimentos() {
        try {
            const res = await fetch(`/api/handoff/silenciados/${this.userId}`);
            const data = await res.json();
            
            if (data.success) {
                return data.chatsSilenciados || [];
            }
            return [];
        } catch (err) {
            console.error('Erro ao listar:', err);
            return [];
        }
    }

    /**
     * Gerar HTML de botão (assumir/liberar)
     */
    gerarBotao(chatId, estaSilenciado = false) {
        const id = `btn-handoff-${chatId.replace(/[^a-zA-Z0-9]/g, '')}`;
        
        if (estaSilenciado) {
            return `
                <button id="${id}" class="btn btn-sm btn-danger" 
                    onclick="handoff.liberar('${chatId}')">
                    🤖 Liberar Bot
                </button>
            `;
        } else {
            return `
                <button id="${id}" class="btn btn-sm btn-primary" 
                    onclick="handoff.assumir('${chatId}')">
                    👤 Assumir
                </button>
            `;
        }
    }

    /**
     * Atualizar UI (usar a cada 10 segundos)
     */
    async atualizarUI() {
        const atendimentos = await this.listarAtendimentos();
        
        // Atualizar todos os botões de handoff
        document.querySelectorAll('[data-chat-id]').forEach(async (elem) => {
            const chatId = elem.dataset.chatId;
            const status = await this.verificarStatus(chatId);
            
            if (status) {
                const btnContainer = elem.querySelector('[data-handoff-btn]');
                if (btnContainer) {
                    btnContainer.innerHTML = this.gerarBotao(chatId, status.estaSilenciado);
                }
            }
        });
    }

    /**
     * Notificação visual (customizar conforme seu design)
     */
    mostrarNotificacao(msg, tipo = 'info') {
        // Se tiver biblioteca de toast (como Toastr), use:
        // toastr[tipo](msg);
        
        // Fallback: alert simples
        console.log(`[${tipo.toUpperCase()}] ${msg}`);
    }
}

// ─────────────────────────────────────────────────
// EXEMPLO DE USO NO HTML
// ─────────────────────────────────────────────────

/*
<script src="handoff-integrator.js"></script>
<script>
    const handoff = new HandoffIntegrator('seu_user_id');
    
    // Atualizar UI a cada 10 segundos
    setInterval(() => handoff.atualizarUI(), 10000);
    
    // Chamar na inicialização
    handoff.atualizarUI();
</script>

<!-- Na tabela de chats -->
<table class="table">
    <tbody>
        <tr data-chat-id="5521987654321@c.us">
            <td>+55 21 98765-4321</td>
            <td>Última msg: 2 min</td>
            <td data-handoff-btn>
                <!-- Preenchido pelo JavaScript -->
            </td>
        </tr>
    </tbody>
</table>
*/
