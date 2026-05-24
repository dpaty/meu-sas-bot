# ✅ CHECKLIST DE IMPLEMENTAÇÃO - GUIA PASSO-A-PASSO

## 📋 ANTES DE COMEÇAR

### Pré-requisitos
- [ ] Node.js 16+ instalado (`node --version`)
- [ ] npm ou yarn instalado
- [ ] Arquivo `.env` com `MASTER_GEMINI_KEY` configurada
- [ ] WhatsApp Business conectado (já existe no seu projeto)
- [ ] Banco SQLite disponível (já criado em `database.sqlite`)

**Teste antes de prosseguir:**
```bash
npm install
npm start
# Deve rodar sem erros na porta 3000
```

---

## 🔧 FASE 1: INTEGRAÇÃO DO CÓDIGO

### Etapa 1.1: Atualizar Banco de Dados
- [ ] Backup do `database.sqlite` (SEGURANÇA PRIMEIRA)
- [ ] Arquivo `src/database/db.js` atualizado ✅ (já feito)
- [ ] Verificar se tem os campos novos:
  ```javascript
  // Rodar no seu ambiente:
  const db = require('./src/database/db');
  const user = await db.getUser('teste');
  console.log(user); // Deve mostrar os campos novos
  ```

### Etapa 1.2: Atualizar Motor de IA
- [ ] Arquivo `src/services/aiService.js` atualizado ✅ (já feito)
- [ ] Verificar se foi importado `const db = require("../database/db");`
- [ ] Verificar se `incrementMessageCounter()` é exportado

### Etapa 1.3: Testar Imports
```bash
# No seu Node terminal:
node -e "const db = require('./src/database/db'); console.log(typeof db.incrementMessageCounter)"
# Deve retornar: "function"
```

---

## 🧪 FASE 2: CRIAR SEU PRIMEIRO CLIENTE

### Etapa 2.1: Usar Exemplo Pronto
```bash
# Copie EXEMPLO_CRIAR_CLIENTE.js
node EXEMPLO_CRIAR_CLIENTE.js

# Log esperado:
# ✅ Cliente criado com sucesso!
# 🎉 SaaS pronto para: Barbearia Maria Silva
# 📊 Limite: 300 mensagens
# ⏰ Expira em: [data]
```

### Etapa 2.2: Validar no BD
```bash
# Acessar o SQLite e verificar:
sqlite3 database.sqlite

# SQL:
SELECT id, company_name, ai_name, personality_type, used_messages, plan_limit FROM users LIMIT 1;

# Deve retornar:
# barbearia-mariasilva-001|Barbearia Maria Silva|Sâmara|friendly|0|300
```

### Etapa 2.3: Criar Seu Próprio Cliente
```javascript
// No seu arquivo JS (ex: criar_cliente.js)
const db = require('./src/database/db');

async function criarMeuCliente() {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 7);

  const meuCliente = {
    id: 'seu-negocio-001',                // Único!
    company_name: 'Seu Negócio',
    business_segment: 'Seu Ramo',
    personality_type: 'friendly',         // professional/friendly/creative
    ai_name: 'Seu_Nome_AI',               // Ex: Bruno, Bruna, etc
    catalog_prices: 'Aqui seus preços...',
    faq_data: 'Aqui suas FAQ...',
    uploaded_context: 'Contexto extra...',
    extra_details: 'Sobre você...',
    plan_type: 'trial',
    plan_limit: 300,
    expires_at: futureDate.toISOString(),
    groq_key: process.env.MASTER_GEMINI_KEY,
    use_ai: 1
  };

  await db.saveUser(meuCliente);
  console.log('✅ Seu cliente foi criado!');
}

criarMeuCliente();
```

---

## 🤖 FASE 3: TESTAR A CONVERSA

### Etapa 3.1: Simular Mensagem do Cliente
```javascript
// No seu servidor ou em um teste:
const aiService = require('./src/services/aiService');

(async () => {
  const resposta = await aiService.getResponse(
    'barbearia-mariasilva-001',  // userId (match com o ID criado)
    'chat-session-001',           // chatId (conversação)
    'Qual é o preço de um corte?', // mensagem
    {
      groq_key: process.env.MASTER_GEMINI_KEY,
      system_prompt: ''
    }
  );

  console.log('🤖 Resposta da IA:', resposta);
  // Esperado: Resposta como "Sâmara" sobre preços
})();
```

### Etapa 3.2: Verificar Contador
```javascript
const db = require('./src/database/db');

(async () => {
  const user = await db.getUser('barbearia-mariasilva-001');
  console.log(`✅ Mensagens usadas: ${user.used_messages} / ${user.plan_limit}`);
  // Esperado: 1 / 300 (após 1 mensagem)
})();
```

### Etapa 3.3: Testar Limite de Mensagens
```javascript
// Se incrementar usado_messages até 300:
const resposta = await aiService.getResponse(
  'barbearia-mariasilva-001',
  'chat-session-001',
  'Nova mensagem?',
  { groq_key: process.env.MASTER_GEMINI_KEY }
);

// Esperado:
// ⚠️ [Alerta do Sistema] O limite foi atingido...
```

---

## 📊 FASE 4: VALIDAÇÃO FINAL

### Checklist de Funcionalidade
- [ ] ✅ Campo `ai_name` aparece nas respostas
- [ ] ✅ Personalidade `friendly` usa tom caloroso
- [ ] ✅ Preços são retirados de `catalog_prices`
- [ ] ✅ FAQ responde perguntas corretas
- [ ] ✅ Contador incrementa a cada mensagem
- [ ] ✅ Após 300 msgs, retorna aviso de limite
- [ ] ✅ Após 7 dias, retorna aviso de expiração

### Checklist de Segurança
- [ ] ✅ `MASTER_GEMINI_KEY` está em `.env` (não em .js)
- [ ] ✅ Validação de limite acontece ANTES de chamar Gemini
- [ ] ✅ Mensagens sensíveis não aparecem em logs
- [ ] ✅ Database.sqlite tem permissões corretas

### Checklist de Performance
- [ ] ✅ Resposta em < 3 segundos (Gemini 3 Flash é rápido)
- [ ] ✅ Sem memory leaks (histórico limitado a 10)
- [ ] ✅ Contador incrementa na primeira chamada

---

## 🚀 FASE 5: PREPARAR PARA VENDER

### Organizar Documentação
- [ ] ✅ Ler `CONFIG_SAAS.md` (entender estrutura)
- [ ] ✅ Ler `ROADMAP.md` (próximas 5 fases)
- [ ] ✅ Ler `README_FASE1_COMPLETA.md` (resumo executivo)

### Preparar Pitch para Cliente
```
"Você vai ter um assistente de IA que:
✓ Conhece seus preços exatamente
✓ Responde suas FAQs automaticamente
✓ Tem a personalidade que você definir
✓ Atende 300 mensagens no trial
✓ Custa R$ 99/mês quando precisar de mais
✓ Parece um funcionário de verdade, não um bot"
```

### Criar Exemplos
- [ ] ✅ Criar conta para CLIENTE A (barbeariam/beleza)
- [ ] ✅ Criar conta para CLIENTE B (comércio/loja)
- [ ] ✅ Criar conta para CLIENTE C (serviços/consultoria)

---

## 📱 FASE 6: INTEGRAÇÃO WHATSAPP

### Conectar ao Fluxo WhatsApp Existente
```javascript
// Seu arquivo que recebe mensagens do WhatsApp
// (provavelmente em src/services/WhatsAppService.js)

const aiService = require('./aiService');
const db = require('../database/db');

async function processarMensagemCliente(userId, chatId, mensagem) {
  try {
    // 1. Buscar config (já está feito no AIService)
    // 2. Chamar IA (já está feito)
    const resposta = await aiService.getResponse(
      userId,
      chatId,
      mensagem,
      {}  // AIService busca do BD automaticamente
    );

    // 3. Enviar resposta no WhatsApp
    await enviarNoWhatsApp(chatId, resposta);

  } catch (error) {
    console.error('Erro ao processar:', error);
  }
}
```

---

## 🎯 TROUBLESHOOTING

### Problema: "MASTER_GEMINI_KEY não encontrada"
```bash
# Solução:
1. Verificar se .env existe
2. Verificar se MASTER_GEMINI_KEY está lá
3. Rodar: npm start (para recarregar environment)
```

### Problema: "incrementMessageCounter não é uma função"
```bash
# Solução:
1. Verificar se db.js foi atualizado corretamente
2. Rodar: node -e "const db = require('./src/database/db'); console.log(db)"
3. Deve listar: { saveUser, getUser, saveMessage, getMessages, incrementMessageCounter }
```

### Problema: "Gemini retorna erro de quota"
```bash
# Solução:
1. Verificar se a chave é F`válida (pode estar expirada)
2. Acessar https://ai.google.dev/ e gerar nova chave
3. Atualizar .env
4. Rodar: npm start
```

### Problema: "Contador não incrementa"
```bash
# Solução:
1. Verificar se usado_messages é INTEGER no SQLite
2. Rodar: sqlite3 database.sqlite ".schema users"
3. Se errado, fazer backup e deletar a tabela (será recriada)
```

---

## 📈 MÉTRICAS PARA ACOMPANHAR

```javascript
// Script para monitorar (salve como monitor.js)
const db = require('./src/database/db');

async function monitorar() {
  const user = await db.getUser('seu-cliente-id');
  
  if (!user) {
    console.log('Cliente não encontrado');
    return;
  }

  const percentual = (user.used_messages / user.plan_limit) * 100;
  const diasRestantes = Math.ceil(
    (new Date(user.expires_at) - new Date()) / (1000 * 60 * 60 * 24)
  );

  console.log(`
📊 MÉTRICAS DO CLIENTE: ${user.company_name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💬 Mensagens: ${user.used_messages}/${user.plan_limit} (${percentual.toFixed(1)}%)
⏰ Dias restantes: ${diasRestantes}
🎭 Personalidade: ${user.personality_type}
📧 IA Nome: ${user.ai_name}
💰 Plano: ${user.plan_type}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
}

monitorar();
```

```bash
node monitor.js
# Rodar a cada dia para acompanhar
```

---

## ✨ SUCESSO!

Se você chegou até aqui e:
- [ ] ✅ Criou um cliente
- [ ] ✅ Testou uma conversa
- [ ] ✅ Viu o contador incrementar
- [ ] ✅ Entendeu o fluxo de limite

**Parabéns! Você está pronto para Fase 2 (Dashboard).**

---

**Próximo Passo**: Começar a trabalhar no Dashboard de Configuração.
**Tempo Estimado**: 1h para completar tudo este checklist.

🚀 **Boa sorte! Você construiu uma máquina de fazer dinheiro.**
