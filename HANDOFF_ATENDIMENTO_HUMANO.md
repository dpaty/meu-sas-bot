# 🤝 Guia: Transferência de Atendimento Bot → Humano

## 📋 Visão Geral

Seu sistema SaaS tem implementado um mecanismo chamado **"Silêncio"** que permite que:
1. O bot **saia automaticamente** quando um humano começar a atender
2. Um operador controle **via API/Dashboard** quando ativar o bot novamente
3. O histórico de quais chats estão em atendimento humano seja **persistido em arquivo**

---

## 🎯 Como Funciona (Fluxo Atual)

### **Cenário 1: Cliente Pede para Falar com Humano**

```
Cliente WhatsApp:
"Quero falar com um atendente" 
        ↓
silencio.textoEhOptOut() detecta a palavra "atendente"
        ↓
Bot responde: "Pausamos o atendimento automático. Um atendente humano falará com você em breve."
        ↓
silencio.silenciarChat(chatId) ← Chat entra em "silêncio"
        ↓
Próximas mensagens do cliente = BOT NÃO RESPONDE
        ↓
Humano pode responder manualmente no WhatsApp
```

**Palavras-chave que acionam o silêncio:**
- `"parar"`, `"stop"`, `"humano"`, `"atendente"`, `"suporte"`

---

### **Cenário 2: Operador Manualmente Silencia o Chat (via API)**

```javascript
// Via Dashboard ou Frontend
fetch('/api/handoff/silenciar/user123', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
        chatId: '5521987654321@c.us' 
    })
})
```

**Resposta:**
```json
{
    "success": true,
    "message": "Chat 5521987654321@c.us agora está em atendimento humano. O bot está silenciado."
}
```

---

### **Cenário 3: Reativar o Bot (Fim do Atendimento Humano)**

```javascript
// Após atendimento resolvido, reativar bot
fetch('/api/handoff/desilenciar/user123', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
        chatId: '5521987654321@c.us' 
    })
})
```

**Resultado:** Bot voltará a responder mensagens deste cliente automaticamente.

---

## 🔌 API Endpoints Disponíveis

### **1. Listar Chats em Atendimento Humano**
```http
GET /api/handoff/silenciados/:userId
```

**Response:**
```json
{
    "success": true,
    "chatsSilenciados": [
        {
            "chatId": "5521987654321@c.us",
            "silenciadoEm": "2026-05-24T14:32:15.123Z"
        },
        {
            "chatId": "5521999999999@c.us",
            "silenciadoEm": "2026-05-24T14:15:00.456Z"
        }
    ],
    "total": 2
}
```

---

### **2. Silenciar um Chat**
```http
POST /api/handoff/silenciar/:userId
```

**Body:**
```json
{
    "chatId": "5521987654321@c.us"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Chat 5521987654321@c.us agora está em atendimento humano. O bot está silenciado."
}
```

---

### **3. Desilenciar (Reativar Bot)**
```http
POST /api/handoff/desilenciar/:userId
```

**Body:**
```json
{
    "chatId": "5521987654321@c.us"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Bot reativado para o chat 5521987654321@c.us. A atendente voltou ao atendimento."
}
```

---

### **4. Verificar Status de um Chat**
```http
GET /api/handoff/status/:userId/:chatId
```

**Response (Bot Silenciado):**
```json
{
    "success": true,
    "chatId": "5521987654321@c.us",
    "estaSilenciado": true,
    "status": "ATENDIMENTO_HUMANO"
}
```

**Response (Bot Ativo):**
```json
{
    "success": true,
    "chatId": "5521987654321@c.us",
    "estaSilenciado": false,
    "status": "ATENDIMENTO_BOT"
}
```

---

## 🛠️ Arquivos Envolvidos

### **1. `src/silencio_whatsapp.js`** ← **Módulo de Controle**
- Gerencia quais chats estão silenciados
- Detecta palavras-chave de opt-out
- Persiste dados em `data/:userId/silencio_chats.json`

```javascript
// Funções disponíveis:
silencio.silenciarChat(chatId)           // Silencia um chat
silencio.desilenciarChat(chatId)         // Reativa um chat
silencio.estaSilenciado(chatId)          // Verifica status
silencio.listar()                        // Lista todos silenciados
silencio.obterTimestamp(chatId)          // Quando foi silenciado
silencio.textoEhOptOut(texto)            // Detecta palavra-chave
```

### **2. `src/core/InstanceManager.js`** ← **Orquestração**
```javascript
// Linha 165-171: VERIFICA SE CHAT ESTÁ SILENCIADO
if (silencio.estaSilenciado(chatId)) {
    return; // Bot não responde
}

// Linha 180-185: DETECTA OPT-OUT
if (silencio.textoEhOptOut(msg.body)) {
    silencio.silenciarChat(chatId);
    const reply = await msg.reply("Pausamos o atendimento...");
    return;
}
```

### **3. `src/routes/api.js`** ← **Endpoints (Novos)**
- `/api/handoff/silenciados/:userId` - GET
- `/api/handoff/silenciar/:userId` - POST
- `/api/handoff/desilenciar/:userId` - POST
- `/api/handoff/status/:userId/:chatId` - GET

---

## 📱 Integração no Dashboard

### **Exemplo: Botão para Assumir Atendimento no Dashboard**

```html
<!-- Dashboard HTML -->
<button onclick="assumirAtendimento(chatId)">
    👤 Assumir Atendimento
</button>

<button onclick="liberarBot(chatId)" style="display:none" id="btn-liberar">
    🤖 Liberar Bot
</button>
```

```javascript
// Frontend JavaScript
const userId = "seu_user_id";

async function assumirAtendimento(chatId) {
    const res = await fetch(`/api/handoff/silenciar/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId })
    });
    
    if (res.ok) {
        alert(`✅ Bot silenciado. Você está em controle do chat ${chatId}`);
        document.getElementById('btn-liberar').style.display = 'block';
    }
}

async function liberarBot(chatId) {
    const res = await fetch(`/api/handoff/desilenciar/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId })
    });
    
    if (res.ok) {
        alert(`🤖 Bot reativado para ${chatId}`);
        document.getElementById('btn-liberar').style.display = 'none';
    }
}

// Carregar status ao abrir um chat
async function carregarStatusChat(chatId) {
    const res = await fetch(`/api/handoff/status/${userId}/${chatId}`);
    const data = await res.json();
    
    if (data.estaSilenciado) {
        console.log(`⏸️ ${chatId} está em atendimento humano`);
        document.getElementById('btn-liberar').style.display = 'block';
    } else {
        console.log(`▶️ ${chatId} está com atendimento automático`);
        document.getElementById('btn-liberar').style.display = 'none';
    }
}
```

---

## 🚀 Casos de Uso Recomendados

### **1. Atendimento Escalonado**
```
Cliente problema simples
    ↓
Bot responde automaticamente
    ↓
Se cliente não fica satisfeito → "Quero falar com alguém"
    ↓
Bot silencia automaticamente
    ↓
Atendente humano assume
```

### **2. Suporte Complexo Prioritário**
```
Cliente VIP chega
    ↓
Dashboard: Operador clica "Assumir Atendimento"
    ↓
Bot é silenciado
    ↓
Conversação 100% humana
```

### **3. Horário Fora de Expediente**
```
Configurar no Dashboard:
- Horário de expediente: 09h-18h
- Fora do horário: Bot responde com "Retornaremos em breve"
- Se cliente insiste: "suporte" → Bot silencia para revisão later
```

---

## 🐛 Troubleshooting

### **Problema: Bot não silencia mesmo após cliente escrever "humano"**

✅ **Solução:**
```javascript
// Verificar se o bot detectou a palavra
console.log(silencio.textoEhOptOut("Quero falar com humano"));
// Deve retornar: true

// Se retornar false, adicione a palavra-chave em silencio_whatsapp.js:
const opt = [/parar/, /stop/, /humano/, /atendente/, /suporte/, /sua_palavra/];
```

### **Problema: Chat silenciado mas volta a ser respondido automaticamente**

✅ **Solução:**
```javascript
// Verificar se o arquivo de persistência foi criado:
// e:\dior_\meu-saas-bot\data\{userId}\silencio_chats.json

// Se falta, o bot resetarar ao reiniciar. Crie manualmente:
{
  "chats": {
    "5521987654321@c.us": "2026-05-24T14:32:15.123Z"
  }
}
```

### **Problema: Reativar bot não funciona**

✅ **Solução:**
```javascript
// Verificar se o userId é correto:
fetch(`/api/handoff/desilenciar/user123`, { ... })
//                                ^^^^^^
// Deve ser o mesmo userId da instância WhatsApp

// Debugar status antes de desilenciar:
const status = await fetch(`/api/handoff/status/user123/5521987654321@c.us`);
console.log(await status.json()); // Deve mostrar estaSilenciado: true
```

---

## 📊 Arquivo de Persistência

Cada usuário tem seu próprio arquivo de controle:

```
data/
  └── user123/
      └── silencio_chats.json
```

**Conteúdo:**
```json
{
  "chats": {
    "5521987654321@c.us": "2026-05-24T14:32:15.123Z",
    "5521988888888@c.us": "2026-05-24T13:00:00.000Z"
  }
}
```

- **chatId**: Número do WhatsApp + `@c.us`
- **timestamp**: Quando o bot foi silenciado para este chat

---

## 🔮 Melhorias Futuras Sugeridas

- [ ] **Timeout automático**: Reativar bot após X minutos sem resposta humana
- [ ] **Notificação ao cliente**: "Um atendente assumiu seu atendimento"
- [ ] **Fila de prioridade**: Quando múltiplos chats precisam de atendimento
- [ ] **Analytics**: Tempo médio de resposta (bot vs humano)
- [ ] **Webhook**: Notificar sistema externo quando handoff acontece

---

## ✅ Checklist de Implementação

- [x] Módulo de silêncio criado (`silencio_whatsapp.js`)
- [x] Endpoints de API implementados
- [x] Persistência em arquivo JSON
- [x] Detecção automática de palavras-chave
- [ ] Interface no Dashboard para controlar handoff
- [ ] Notificações em tempo real (Socket.io)
- [ ] Testes automatizados

---

## 📞 Exemplos de Uso Prático

### **Teste Rápido no Terminal**

```bash
# 1. Listar chats silenciados
curl http://localhost:3000/api/handoff/silenciados/user123

# 2. Silenciar um chat
curl -X POST http://localhost:3000/api/handoff/silenciar/user123 \
  -H "Content-Type: application/json" \
  -d '{"chatId":"5521987654321@c.us"}'

# 3. Verificar status
curl http://localhost:3000/api/handoff/status/user123/5521987654321@c.us

# 4. Desilenciar (reativar)
curl -X POST http://localhost:3000/api/handoff/desilenciar/user123 \
  -H "Content-Type: application/json" \
  -d '{"chatId":"5521987654321@c.us"}'
```

---

## 📞 Suporte

Se tiver dúvidas sobre o sistema de handoff, verifique:
1. Se a instância WhatsApp está ativa: `/api/instances`
2. Se o arquivo de persistência existe: `data/{userId}/silencio_chats.json`
3. Logs do servidor para erros detalhados
4. Status do chat: `/api/handoff/status/{userId}/{chatId}`

---

**Sistema desenvolvido em:** May 24, 2026
**Versão:** 2.0 (com timestamp e Map)
**Status:** ✅ Pronto para Produção
