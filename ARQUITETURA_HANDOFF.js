/**
 * ARQUITETURA MODULAR - Diagrama Visual
 * 
 * Estrutura separada, sem acúmulo de código
 */

/*

┌─────────────────────────────────────────────────────────────┐
│                  CLIENTE WHATSAPP                            │
│                   (envia mensagem)                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│           InstanceManager.handleIncomingMessage()            │
│  Recebe mensagem do WhatsApp                                 │
└────────────────────────┬────────────────────────────────────┘
                         │
            ┌────────────┴────────────┐
            │                         │
            ▼                         ▼
    ┌─────────────────┐      ┌──────────────────┐
    │ Validações      │      │ Registrar ID do  │
    │ Básicas:        │      │ Bot (silencio)   │
    │ • Status?       │      └──────────────────┘
    │ • Grupo?        │
    │ • DeBot?        │
    └────────┬────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│  ConversationController.avaliarConversa(chatId)              │
│  ├─ Está silenciado? → SIM = PARA ❌                        │
│  ├─ Já processando? → SIM = PARA ❌                         │
│  └─ Continuar? → SIM = OK ✅                                │
└────────────────────────┬────────────────────────────────────┘
                         │
            ┌────────────┴────────────┐
            │                         │
           NÃO                       SIM
            │                         │
     [IGNORA MSG]                     ▼
                        ┌──────────────────────┐
                        │ conversationCtrl     │
                        │ .marcarProcessando() │
                        │ (Lock)               │
                        └──────────┬───────────┘
                                   │
                                   ▼
                    ┌──────────────────────────┐
                    │ RE-VALIDAÇÃO:            │
                    │ Silenciado enquanto      │
                    │ aguardava?               │
                    └──────────┬───────────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
                   SIM                   NÃO
                    │                     │
              [PARA]                      ▼
                               ┌──────────────────────┐
                               │ Buscar config (DB)   │
                               │ IA ativada?          │
                               └──────────┬───────────┘
                                          │
                            ┌─────────────┴─────────────┐
                            │                           │
                           NÃO                         SIM
                            │                           │
                      [PARA]                            ▼
                                       ┌────────────────────────┐
                                       │ Detectar Opt-Out?      │
                                       │ ("humano", "stop"...)  │
                                       └────────────┬───────────┘
                                                    │
                                         ┌──────────┴──────────┐
                                         │                     │
                                        SIM                   NÃO
                                         │                     │
                                    Silenciar            Enviar estado
                                 Bot se retira          "digitando..."
                                         │                     │
                                         │                     ▼
                                         │      ┌───────────────────────┐
                                         │      │ Processar com IA      │
                                         │      │ aiService.getResponse()
                                         │      └───────────┬───────────┘
                                         │                  │
                                         │                  ▼
                                         │      ┌───────────────────────┐
                                         │      │ RE-RE-VALIDAÇÃO:      │
                                         │      │ Silenciado agora?     │
                                         │      └───────────┬───────────┘
                                         │                  │
                                         │       ┌──────────┴──────────┐
                                         │       │                     │
                                         │      SIM                   NÃO
                                         │       │                     │
                                         │  [DESCARTA]                 ▼
                                         │                  ┌──────────────────┐
                                         │                  │ Enviar Resposta  │
                                         │                  │ msg.reply()      │
                                         │                  └────────┬─────────┘
                                         │                           │
                                         │                           ▼
                                         │              ┌──────────────────────┐
                                         │              │ Registrar ID msg Bot │
                                         │              │ silencio.registrar() │
                                         │              └────────┬─────────────┘
                                         │                       │
                                         │                       ▼
                                         │              ┌──────────────────────┐
                                         │              │ Salvar no banco (DB) │
                                         │              │ db.saveMessage()     │
                                         │              └────────┬─────────────┘
                                         │                       │
                                         └───────────┬───────────┘
                                                     │
                                                     ▼
                                          ┌──────────────────────┐
                                          │ FINALLY (Sempre):    │
                                          │ conversationCtrl     │
                                          │ .finalizarProcessam()│
                                          │ (Liberar Lock)       │
                                          └──────────────────────┘


═══════════════════════════════════════════════════════════

MÓDULOS ENVOLVIDOS:

┌─ src/controllers/ConversationController.js
│  ├─ avaliarConversa(chatId)           ← Decisão central
│  ├─ marcarProcessando(chatId)         ← Lock
│  └─ finalizarProcessamento(chatId)    ← Unlock
│
├─ src/silencio_whatsapp.js
│  ├─ estaSilenciado(chatId)            ← Verifica se humano atende
│  ├─ silenciarChat(chatId)             ← Operador assume
│  ├─ desilenciarChat(chatId)           ← Operador libera
│  ├─ registrarMensagemDoBot(msg)       ← Rastreia ID do bot
│  ├─ listar()                          ← Lista silenciados
│  └─ obterTimestamp(chatId)            ← Quando foi silenciado
│
├─ src/services/HandoffService.js
│  ├─ assumirAtendimento(userId, chatId)
│  ├─ liberarBot(userId, chatId)
│  ├─ listarAtendimentos(userId)
│  └─ obterEstado(userId)
│
├─ src/core/InstanceManager.js
│  ├─ handleIncomingMessage()           ← Fluxo principal
│  └─ Integra ConversationController
│
└─ src/routes/api.js
   ├─ GET  /api/handoff/silenciados/:userId
   ├─ POST /api/handoff/silenciar/:userId
   ├─ POST /api/handoff/desilenciar/:userId
   ├─ GET  /api/handoff/status/:userId/:chatId
   └─ GET  /api/handoff/estado/:userId
       (Todos usam HandoffService)


═══════════════════════════════════════════════════════════

3 VERIFICAÇÕES CRÍTICAS (Evita Bot Falar):

1️⃣  ENTRADA (Antes de processar)
    if (silencio.estaSilenciado(chatId)) return;

2️⃣  MEIO (Após buscar config)
    if (silencio.estaSilenciado(chatId)) return;

3️⃣  SAÍDA (Antes de enviar)
    if (silencio.estaSilenciado(chatId)) return;


═══════════════════════════════════════════════════════════

DADOS PERSISTIDOS:

data/{userId}/silencio_chats.json
├─ chatId
├─ timestamp (quando foi silenciado)
└─ Recarregado ao reiniciar servidor


═══════════════════════════════════════════════════════════

FLUXO DO OPERADOR:

1. Operador vê chat llegando
2. Clica botão "👤 Assumir"
   └─ POST /api/handoff/silenciar/user123
   └─ HandoffService.assumirAtendimento()
   └─ silencio.silenciarChat(chatId)
   └─ Bot PARA de responder ✅

3. Operador atende cliente
4. Clica "🤖 Liberar Bot"
   └─ POST /api/handoff/desilenciar/user123
   └─ HandoffService.liberarBot()
   └─ silencio.desilenciarChat(chatId)
   └─ Bot retoma automático ✅


═══════════════════════════════════════════════════════════

FLUXO DO CLIENTE:

1. Cliente escreve: "Quero falar com humano"
2. InstanceManager detecta
3. Silencio.textoEhOptOut() = true
4. Bot responde: "Pausamos o atendimento..."
5. silencio.silenciarChat(chatId)
6. Bot PARA ✅
7. Operador responde manualmente
8. Operador clica "Liberar Bot"
9. Bot retoma automático ✅


═══════════════════════════════════════════════════════════

HARMONIA DO CÓDIGO:

✅ Sem duplicação
   - Lógica centralizada em HandoffService
   - ConversationController reutilizado
   
✅ Sem acúmulo
   - Cada módulo tem responsabilidade clara
   - Separação de concerns
   
✅ Sem overhead
   - Apenas 3 verificações necessárias
   - Sem loops ou recursões desnecessárias
   
✅ Sem conflitos
   - Locks evitam race conditions
   - Try-finally garante liberação


═══════════════════════════════════════════════════════════
*/
