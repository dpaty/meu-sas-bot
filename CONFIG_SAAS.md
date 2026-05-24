# 🚀 Guia de Configuração - SaaS Profissional com Isca Gratuita

## 📋 Estrutura Nova do Banco de Dados

A tabela `users` agora suporta uma configuração corporativa completa:

```json
{
  "id": "empresa-123",
  
  // 📊 INFORMAÇÕES DA EMPRESA
  "company_name": "Barbearia Premium",
  "business_segment": "Serviços de Beleza e Cuidado Pessoal",
  
  // 🎭 PERSONALIDADE DA IA
  "personality_type": "friendly",        // professional | friendly | creative
  "ai_name": "Sâmara",
  
  // 📚 BLOCOS DE CONHECIMENTO ESTRUTURADO
  "catalog_prices": "Corte: R$ 50\nBarba: R$ 30\nSobrancelha: R$ 20\nPacote Completo: R$ 85",
  "faq_data": "P: Vocês atendem mulheres?\nR: Sim, temos barberass especializadas.\nP: Qual horário de funcionamento?\nR: Seg-Sex 9h-21h, Sábado 9h-18h",
  "uploaded_context": "Conteúdo de arquivo TXT com serviços especiais, histórico, etc.",
  "extra_details": "Dona: Maria Silva. 15 anos no mercado. Referência em cortes masculinos.",
  
  // ⚡ CONFIGURAÇÃO DE ISCA GRATUITA
  "plan_type": "trial",                 // trial | pro
  "plan_limit": 300,                    // Limite de mensagens permitidas
  "used_messages": 145,                 // Contador atual (incrementa a cada mensagem)
  "expires_at": "2025-05-30T23:59:59Z", // Data de expiração do trial
  
  // 🛡️ LEGADO (compatível com versão anterior)
  "system_prompt": "Regras adicionais específicas...",
  "groq_key": "gsk_...",                // Chave da API
  "ai_model": "gemini-3-flash-preview",
  "use_ai": 1
}
```

---

## 🎨 Personalidades Disponíveis

### **professional** (Padrão)
- Tom formal e direto
- Perfeito para: Consultoria, Advocacia, Finanças
- Temperature: 0.5 (mais previsível)

### **friendly**
- Tom caloroso e empático
- Perfeito para: Varejo, Serviços de Beleza, Saúde
- Temperature: 0.6 (equilibrado)

### **creative**
- Tom relaxado e humorado
- Perfeito para: Marketing, Agências, Startups
- Temperature: 0.8 (mais criativo)

---

## 💰 Sistema de Isca Gratuita

O sistema **automaticamente bloqueia** mensagens quando:

1. ✋ `used_messages` >= `plan_limit` → Retorna mensagem de limite atingido
2. ⏰ Data atual > `expires_at` → Retorna mensagem de expiração

**Exemplo de resposta ao cliente:**
```
⚠️ [Alerta do Sistema] O limite de mensagens do plano de testes 
da empresa Barbearia Premium foi atingido. Para reativar o atendimento, 
por favor entre em contato com o suporte.
```

---

## 📝 Como Inserir um Novo Cliente (Exemplo)

```javascript
const db = require('./src/database/db');

// Simular data de 7 dias a partir de agora
const futureDate = new Date();
futureDate.setDate(futureDate.getDate() + 7);

const novoCliente = {
  id: 'barbearia-123',
  company_name: 'Barbearia Premium',
  business_segment: 'Serviços de Beleza',
  personality_type: 'friendly',
  ai_name: 'Sâmara',
  catalog_prices: 'Corte: R$ 50\nBarba: R$ 30\nPacote: R$ 85',
  faq_data: 'P: Aceitam cartão?\nR: Sim, todas as bandeiras.',
  uploaded_context: 'Conteúdo de arquivo...',
  extra_details: 'Especialidade em cortes modernos.',
  plan_type: 'trial',
  plan_limit: 300,
  expires_at: futureDate.toISOString(),
  groq_key: process.env.MASTER_GEMINI_KEY,  // Usando Master Key
  use_ai: 1
};

await db.saveUser(novoCliente);
console.log('✅ Cliente criado com sucesso!');
```

---

## 🔍 Monitorar Consumo de Créditos

```javascript
const user = await db.getUser('barbearia-123');
console.log(`Mensagens usadas: ${user.used_messages} / ${user.plan_limit}`);

const percentualUsado = (user.used_messages / user.plan_limit) * 100;
console.log(`Percentual: ${percentualUsado.toFixed(1)}%`);

if (percentualUsado > 80) {
  console.log('⚠️ Cliente próximo ao limite!');
}
```

---

## 🛡️ Fluxo de Segurança na Resposta IA

```
Cliente envia mensagem
         ↓
AIService.getResponse() é chamado
         ↓
✅ Verifica se usário existe
✅ Verifica limite de mensagens
✅ Verifica data de expiração
✅ Monta SYSTEM_INSTRUCTION consolidado
✅ Chama Gemini 3 Flash
✅ Incrementa counter
✅ Salva no histórico
         ↓
Resposta enviada ao cliente
```

---

## 📊 Dashboard Futuro

O dashboard próximo exibirá:

- **Barra de Progresso de Créditos**: Mostra quantas mensagens restam
- **Badge de Status**: Trial / Pro / Expirado
- **Seções de Edição**: 
  - Informações da Empresa
  - Personalidade & Tom de Voz
  - Tabela de Preços
  - FAQ
  - Upload de Arquivos TXT
- **Histórico em Tempo Real**: Últimas mensagens com análise de sentimento

---

## 🎯 Próximos Passos

- [ ] Criar UI do Dashboard para editar Personalidades
- [ ] Criar Upload de Arquivos (TXT/PDF) para `uploaded_context`
- [ ] Implementar Webhook de Pagamento (Stripe/PagSeguro) para upgrade Pro
- [ ] Dashboard de Análytics (gráficos de consumo)
- [ ] Sistema de Resetting de Quotas (mensal/anual)
- [ ] Suporte a Múltiplas Chaves de API (Load Balancing)

---

## 💡 Segredo do Sucesso

A **Transparência de Capacidade** é a chave:
- O cliente vê claramente quantas mensagens ele tem
- Sente que está "treinando um funcionário real"
- Quando vê o limite próximo, ele já pensa em upgrade
- Não parece um robô, parece um colega competente

🚀 **Pronto para escalar.**
