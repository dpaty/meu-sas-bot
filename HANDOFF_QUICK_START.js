/**
 * SISTEMA DE HANDOFF - Guia Prático e Direto
 * 
 * Estrutura Modular:
 * ├── src/controllers/ConversationController.js  ← Controla fluxo de respostas
 * ├── src/services/HandoffService.js            ← Gerencia assumir/liberar
 * ├── src/silencio_whatsapp.js                  ← Persiste estado
 * └── src/routes/api.js                         ← Endpoints HTTP
 * 
 * Garantia: Quando humano assume → BOT PARA (3 verificações)
 */

// ═══════════════════════════════════════════════════════════
// 1️⃣  COMO USAR VIA API
// ═══════════════════════════════════════════════════════════

// LISTAR chats em atendimento humano
curl http://localhost:3000/api/handoff/silenciados/user123

// ASSUMIR um chat (operador pega)
curl -X POST http://localhost:3000/api/handoff/silenciar/user123 \
  -H "Content-Type: application/json" \
  -d '{"chatId":"5521987654321@c.us"}'

// LIBERAR bot (finalizar atendimento)
curl -X POST http://localhost:3000/api/handoff/desilenciar/user123 \
  -H "Content-Type: application/json" \
  -d '{"chatId":"5521987654321@c.us"}'

// VERIFICAR status de um chat
curl http://localhost:3000/api/handoff/status/user123/5521987654321@c.us

// VER ESTADO geral de atendimentos
curl http://localhost:3000/api/handoff/estado/user123

// ═══════════════════════════════════════════════════════════
// 2️⃣  COMO USAR NO FRONTEND
// ═══════════════════════════════════════════════════════════

import HandoffManager from './handoff-dashboard.js';

const manager = new HandoffManager('seu_user_id');

// Assumir atendimento de um cliente
await manager.assumirAtendimento('5521987654321@c.us');

// Liberar bot quando terminar
await manager.liberarBot('5521987654321@c.us');

// Atualizar lista automaticamente
manager.iniciarAtualizacaoAutomatica(10000); // A cada 10s

// ═══════════════════════════════════════════════════════════
// 3️⃣  FLUXO INTERNO - Como o BOT PARA
// ═══════════════════════════════════════════════════════════

/*
Quando mensagem chega:
  └─ InstanceManager.handleIncomingMessage()
     └─ ConversationController.avaliarConversa()
        ├─ Check 1: Está silenciado? → SIM = PARA
        ├─ Check 2: Já processando? → SIM = PARA
        └─ Check 3: Re-validar antes de enviar → AINDA SILENCIADO? → PARA
*/

// ═══════════════════════════════════════════════════════════
// 4️⃣  PALAVRAS-CHAVE QUE DISPARAM SILÊNCIO AUTOMÁTICO
// ═══════════════════════════════════════════════════════════

Cliente escreve qualquer uma:
- "parar"
- "stop"
- "humano"
- "atendente"
- "suporte"

→ Bot responde: "Pausamos o atendimento. Aguarde um atendente."
→ Bot se silencia automaticamente
→ Próximas mensagens = bot não responde

// ═══════════════════════════════════════════════════════════
// 5️⃣  ARQUIVOS ENVOLVIDOS
// ═══════════════════════════════════════════════════════════

// Nova estrutura de diretórios:
src/
├── controllers/
│   └── ConversationController.js    ← [NOVO] Decisões de resposta
├── core/
│   └── InstanceManager.js           ← [REFATORADO] Fluxo melhorado
├── services/
│   ├── HandoffService.js            ← [NOVO] API interna
│   └── aiService.js
├── silencio_whatsapp.js             ← [MELHORADO] Timestamps
└── routes/
    └── api.js                       ← [REFATORADO] Endpoints limpos

// ═══════════════════════════════════════════════════════════
// 6️⃣  TESTE RÁPIDO
// ═══════════════════════════════════════════════════════════

// 1. Terminal 1: Inicie o servidor
npm start

// 2. Terminal 2: Teste o endpoint
curl -X POST http://localhost:3000/api/handoff/silenciar/user123 \
  -H "Content-Type: application/json" \
  -d '{"chatId":"5521987654321@c.us"}'

// Resposta:
// {
//   "success": true,
//   "message": "✅ Você assumiu o atendimento...",
//   "silenciadoEm": "2026-05-25T10:30:45.123Z"
// }

// 3. Envie mensagens no WhatsApp → Bot NÃO responde
// 4. Terminal 2: Libere o bot
curl -X POST http://localhost:3000/api/handoff/desilenciar/user123 \
  -H "Content-Type: application/json" \
  -d '{"chatId":"5521987654321@c.us"}'

// 5. Envie mensagens no WhatsApp → Bot responde novamente ✅

// ═══════════════════════════════════════════════════════════
// 7️⃣  GARANTIA: 3 VERIFICAÇÕES ANTES DE RESPONDER
// ═══════════════════════════════════════════════════════════

const handleIncomingMessage = async (userId, msg) => {
    
    // ✅ CHECK 1: Validar instância
    if (!instanceManager.instances.has(userId)) return;
    
    // ✅ CHECK 2: Está silenciado?
    const avaliacao = conversationCtrl.avaliarConversa(chatId);
    if (!avaliacao.podeResponder) return; // BOT PARA
    
    // ✅ CHECK 3: Marcar como processando (evita duplicação)
    conversationCtrl.marcarProcessando(chatId);
    
    try {
        // ⚠️ RE-VALIDAÇÃO: Pode ter sido silenciado enquanto aguardava
        if (silencio.estaSilenciado(chatId)) return; // BOT PARA
        
        // Processar IA...
        const response = await aiService.getResponse(...);
        
        // ⚠️ ÚLTIMA VERIFICAÇÃO: Antes de enviar
        if (silencio.estaSilenciado(chatId)) return; // BOT PARA (não envia)
        
        // Enviar resposta
        await msg.reply(response);
    } finally {
        // Sempre liberar lock
        conversationCtrl.finalizarProcessamento(chatId);
    }
};

// ═══════════════════════════════════════════════════════════
// 8️⃣  PERSISTÊNCIA - Dados Salvos em Disco
// ═══════════════════════════════════════════════════════════

// Arquivo: data/{userId}/silencio_chats.json
{
  "chats": {
    "5521987654321@c.us": "2026-05-25T10:30:45.123Z",
    "5521988888888@c.us": "2026-05-25T09:15:00.456Z"
  }
}

// Dados persistem se o servidor reiniciar
// Cada chat rastreia QUANDO foi silenciado

// ═══════════════════════════════════════════════════════════
// 9️⃣  LOGS NO SERVIDOR
// ═══════════════════════════════════════════════════════════

// Quando assumir:
[MESSAGE] 👤 Chat 5521987654321@c.us requeriu atendimento humano. Bot silenciado.

// Quando mensagem chega durante silêncio:
[CTRL] ⏸️  Chat 5521987654321@c.us está em atendimento humano. Bot bloqueado.

// Quando liberar:
[MESSAGE] 🤖 Bot reativado para: 5521987654321@c.us

// ═══════════════════════════════════════════════════════════
// 🔟 PRÓXIMOS PASSOS (OPCIONAL)
// ═══════════════════════════════════════════════════════════

☐ Integrar no Dashboard (UI com botões)
☐ Notificações Socket.io em tempo real
☐ Timeout automático (liberar após 30min)
☐ Fila de prioridade para múltiplos atendimentos
☐ Analytics (tempo de resposta)

// ═══════════════════════════════════════════════════════════
// ⚡ RESUMO
// ═══════════════════════════════════════════════════════════

✅ Modularizado: Controllers, Services, Routes separadas
✅ Robusto: 3 verificações antes de responder
✅ Persistente: Dados salvos em disco
✅ Limpo: Sem código duplicado
✅ Pronto: Pronto para usar em produção

Status: 🚀 COMPLETO E TESTADO
Data: 25/05/2026
