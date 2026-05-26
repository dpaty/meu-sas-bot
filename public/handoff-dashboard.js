/**
 * HANDOFF_DASHBOARD.js
 * 
 * Código para integrar no seu dashboard (dashboard-v2.html)
 * Permite assumir/liberar atendimento de chats com botões visuais
 * 
 * Uso: Adicione este script no seu dashboard e chame as funções conforme necessário
 */

class HandoffManager {
    constructor(userId) {
        this.userId = userId;
        this.chatEmAtendimento = new Set();
        this.atualizandoUI = false;
    }

    /**
     * 📋 Carregar lista de chats em atendimento humano
     */
    async carregarChatsEmAtendimento() {
        try {
            const response = await fetch(`/api/handoff/silenciados/${this.userId}`);
            if (!response.ok) throw new Error('Erro ao carregar chats');
            
            const data = await response.json();
            this.chatEmAtendimento = new Set(
                data.chatsSilenciados.map(c => c.chatId)
            );
            
            console.log(`✅ ${data.total} chat(s) em atendimento humano`);
            return data.chatsSilenciados;
        } catch (err) {
            console.error('❌ Erro ao carregar chats:', err);
            return [];
        }
    }

    /**
     * 👤 Assumir Atendimento de um Chat
     */
    async assumirAtendimento(chatId) {
        try {
            const response = await fetch(`/api/handoff/silenciar/${this.userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chatId })
            });

            if (!response.ok) throw new Error('Erro ao assumir atendimento');

            const data = await response.json();
            this.chatEmAtendimento.add(chatId);
            this.atualizarUIChat(chatId, true);
            
            console.log(`✅ Você assumiu o atendimento de ${chatId}`);
            return data;
        } catch (err) {
            console.error('❌ Erro ao assumir atendimento:', err);
            alert('Erro ao assumir atendimento. Tente novamente.');
        }
    }

    /**
     * 🤖 Liberar Bot (Reativar Atendimento Automático)
     */
    async liberarBot(chatId) {
        try {
            const response = await fetch(`/api/handoff/desilenciar/${this.userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chatId })
            });

            if (!response.ok) throw new Error('Erro ao liberar bot');

            const data = await response.json();
            this.chatEmAtendimento.delete(chatId);
            this.atualizarUIChat(chatId, false);
            
            console.log(`✅ Bot reativado para ${chatId}`);
            return data;
        } catch (err) {
            console.error('❌ Erro ao liberar bot:', err);
            alert('Erro ao liberar bot. Tente novamente.');
        }
    }

    /**
     * 📊 Verificar Status de um Chat Específico
     */
    async verificarStatus(chatId) {
        try {
            const response = await fetch(
                `/api/handoff/status/${this.userId}/${chatId}`
            );

            if (!response.ok) throw new Error('Erro ao verificar status');

            const data = await response.json();
            return {
                chatId,
                estaSilenciado: data.estaSilenciado,
                status: data.status
            };
        } catch (err) {
            console.error('❌ Erro ao verificar status:', err);
            return null;
        }
    }

    /**
     * 🔄 Atualizar UI de um chat específico
     */
    atualizarUIChat(chatId, emAtendimento) {
        const btn = document.getElementById(`btn-handoff-${chatId}`);
        if (!btn) return;

        if (emAtendimento) {
            btn.innerHTML = '🤖 Liberar Bot';
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-danger');
            btn.onclick = () => this.liberarBot(chatId);
        } else {
            btn.innerHTML = '👤 Assumir';
            btn.classList.remove('btn-danger');
            btn.classList.add('btn-primary');
            btn.onclick = () => this.assumirAtendimento(chatId);
        }
    }

    /**
     * 🔄 Atualizar UI de todos os chats
     */
    async atualizarUITodos() {
        const chats = await this.carregarChatsEmAtendimento();
        
        // Atualizar todos os botões
        document.querySelectorAll('[data-handoff-btn]').forEach(btn => {
            const chatId = btn.dataset.chatId;
            const emAtendimento = chats.some(c => c.chatId === chatId);
            this.atualizarUIChat(chatId, emAtendimento);
        });
    }

    /**
     * 📱 Adicionar coluna de status para cada chat no dashboard
     */
    gerarHTMLBotao(chatId) {
        const emAtendimento = this.chatEmAtendimento.has(chatId);
        const btnTexto = emAtendimento ? '🤖 Liberar Bot' : '👤 Assumir';
        const btnClasse = emAtendimento ? 'btn btn-danger btn-sm' : 'btn btn-primary btn-sm';
        
        return `
            <button 
                id="btn-handoff-${chatId}"
                data-handoff-btn
                data-chat-id="${chatId}"
                class="${btnClasse}"
                onclick="handoffManager.${emAtendimento ? 'liberarBot' : 'assumirAtendimento'}('${chatId}')"
            >
                ${btnTexto}
            </button>
        `;
    }

    /**
     * ⏰ Iniciar polling para atualizar status a cada 10 segundos
     */
    iniciarAtualizacaoAutomatica(intervalo = 10000) {
        console.log('🔄 Atualizações automáticas iniciadas...');
        setInterval(() => this.atualizarUITodos(), intervalo);
    }

    /**
     * 📊 Exibir painel com todos os chats em atendimento
     */
    async exibirPainelAtendimentos() {
        const chats = await this.carregarChatsEmAtendimento();
        
        if (chats.length === 0) {
            console.log('ℹ️ Nenhum chat em atendimento humano no momento.');
            return;
        }

        console.log(`\n📊 CHATS EM ATENDIMENTO HUMANO (${chats.length}):\n`);
        chats.forEach((chat, i) => {
            const horario = new Date(chat.silenciadoEm).toLocaleTimeString('pt-BR');
            console.log(`${i + 1}. ${chat.chatId} - Silenciado às ${horario}`);
        });
        console.log('\n');
    }
}

// ─────────────────────────────────────────────────────────────────
// INTEGRAÇÃO NO DASHBOARD
// ─────────────────────────────────────────────────────────────────

/**
 * NO SEU ARQUIVO: public/dashboard-v2.html
 * 
 * 1. ADICIONAR ESTE SCRIPT:
 * <script src="handoff-dashboard.js"></script>
 * 
 * 2. INICIALIZAR NA PÁGINA:
 * <script>
 *   const handoffManager = new HandoffManager('seu_user_id');
 *   
 *   // Ao carregar a página
 *   document.addEventListener('DOMContentLoaded', () => {
 *       handoffManager.atualizarUITodos();
 *       handoffManager.iniciarAtualizacaoAutomatica(10000); // A cada 10s
 *   });
 * </script>
 * 
 * 3. ADICIONAR COLUNA NA TABELA DE CHATS:
 * <table class="table">
 *   <thead>
 *     <tr>
 *       <th>Cliente</th>
 *       <th>Última Msg</th>
 *       <th>Status</th>
 *       <th>Ação</th>  <!-- NOVA COLUNA -->
 *     </tr>
 *   </thead>
 *   <tbody id="chats-lista\">\n *     <!-- Linhas carregadas dinamicamente -->\n *   </tbody>\n * </table>\n * \n * 4. AO RENDERIZAR CADA CHAT, INCLUIR:\n * const linha = `\n *   <tr>\n *     <td>${chat.numero}</td>\n *     <td>${chat.ultimaMensagem}</td>\n *     <td>\n *       <span class=\"status-badge\" id=\"status-${chat.id}\">\n *         🤖 Bot Ativo\n *       </span>\n *     </td>\n *     <td>\n *       ${handoffManager.gerarHTMLBotao(chat.id)}\n *     </td>\n *   </tr>\n * `;\n * document.getElementById('chats-lista').innerHTML += linha;\n * \n * PRONTO! Agora você tem botões para assumir/liberar atendimento.\n */\n\n// ─────────────────────────────────────────────────────────────────\n// EXEMPLOS DE USO\n// ─────────────────────────────────────────────────────────────────\n\n/*\n\n// Exemplo 1: Usar em um script simples\nconst handoffManager = new HandoffManager('user123');\n\n// Carregar chats em atendimento\nawait handoffManager.carregarChatsEmAtendimento();\n\n// Assumir atendimento de um cliente\nawait handoffManager.assumirAtendimento('5521987654321@c.us');\n\n// Liberar bot\nawait handoffManager.liberarBot('5521987654321@c.us');\n\n// Verificar status\nconst status = await handoffManager.verificarStatus('5521987654321@c.us');\nconsole.log(status);\n// Output: { chatId: '5521987654321@c.us', estaSilenciado: true, status: 'ATENDIMENTO_HUMANO' }\n\n// Gerar HTML de botão\nconst html = handoffManager.gerarHTMLBotao('5521987654321@c.us');\ndocument.getElementById('container').innerHTML += html;\n\n// Atualizar UI de todos os chats a cada 10 segundos\nhandoffManager.iniciarAtualizacaoAutomatica(10000);\n\n// Ver painel com todos os atendimentos\nawait handoffManager.exibirPainelAtendimentos();\n\n*/\n