# 🗺️ ROADMAP SAAS - Próximas Fases

## ✅ FASE 1: Reestruturação do Núcleo (COMPLETA)

### Banco de Dados
- [x] Adicionar campos de empresa
- [x] Adicionar blocos de conhecimento (Preços, FAQ, Contexto Extra)
- [x] Adicionar controle de Isca Gratuita (plan_type, plan_limit, used_messages, expires_at)
- [x] Adicionar personalidades (personality_type, ai_name)
- [x] Implementar incrementMessageCounter()

### Motor de IA
- [x] Integrar validação de limites (ANTES de chamar Gemini)
- [x] Integrar validação de expiração
- [x] Definir 3 personalidades com temperaturas diferentes
- [x] Montar system_instruction consolidado com 4 blocos
- [x] Incremento automático de contador
- [x] Mensagens de bloqueio personalizadas

### Documentação
- [x] Guia CONFIG_SAAS.md
- [x] Exemplo prático EXEMPLO_CRIAR_CLIENTE.js
- [x] .env.example com variáveis necessárias
- [x] Este Roadmap

---

## 🚀 FASE 2: Dashboard Profissional (PRÓXIMA)

### Interface de Configuração
- [ ] Tela de Setup Inicial (wizard de 5 passos)
- [ ] Edição de Informações da Empresa
- [ ] Seletor Visual de Personalidades + Preview
- [ ] Editor de Tabela de Preços (WYSIWYG)
- [ ] Editor de FAQ (com q&a dinâmico)
- [ ] Upload de Arquivo TXT para "Conhecimento Extra"

### Dashboard de Analytics
- [ ] Gráfico de Consumo de Mensagens (linha temporal)
- [ ] % de Crescimento Mês a Mês
- [ ] Tempo Médio de Resposta
- [ ] Taxa de Engajamento
- [ ] Última frase mais frequente do cliente

### Controle de Conta
- [ ] Visualizar Status do Plano (Trial/Pro)
- [ ] Ver Data de Expiração
- [ ] Botão "Upgrade para Pro"
- [ ] Histórico de Faturas
- [ ] Gerenciar Chaves de API

**Tempo Estimado: 5-7 dias**

---

## 💳 FASE 3: Sistema de Pagamento

### Integração Stripe/PagSeguro
- [ ] Webhooks de pagamento
- [ ] Confirmação automática de upgrade
- [ ] Renovação automática (cobranças recorrentes)
- [ ] Invoice por email
- [ ] Relatório fiscal

### Aumentos de Limite
- [ ] Plano Trial: 300 mensagens/7 dias (GRÁTIS)
- [ ] Plano Pro: 5.000 mensagens/mês (R$ 99)
- [ ] Plano Ent: 50.000 mensagens/mês (R$ 499)
- [ ] Plano Custom: Ilimitado (R$ 1.999+)

**Tempo Estimado: 3-5 dias**

---

## 🔐 FASE 4: Recursos Avançados

### Multi-Usuários por Empresa
- [ ] Adicionar tabela `team_members`
- [ ] Diferentes níveis de acesso (Admin/Editor/Viewer)
- [ ] Auditoria de quem mudou o quê

### Integrações
- [ ] Instagram DM (além de WhatsApp)
- [ ] Telegram
- [ ] Messenger (Facebook)
- [ ] Email automático

### IA Avançada
- [ ] Fine-tuning de modelo (dedicado por cliente)
- [ ] Análise de sentimento das mensagens
- [ ] Sugestões de melhoria automáticas
- [ ] A/B Testing de respostas

**Tempo Estimado: 10-15 dias**

---

## 🌍 FASE 5: Escalabilidade & Segurança

### Infraestrutura
- [ ] Migrar de SQLite para PostgreSQL
- [ ] Load Balancing (múltiplos servidores)
- [ ] Cache Redis
- [ ] CDN para imagens
- [ ] Backup automático diário

### Segurança
- [ ] HTTPS em tudo
- [ ] Rate Limiting
- [ ] Validação de entrada (XSS/SQL Injection)
- [ ] Logs centralizados
- [ ] Monitoramento 24/7

### SLA & Compliance
- [ ] Garantia de 99.9% uptime
- [ ] LGPD (Lei Geral de Proteção de Dados)
- [ ] Criptografia de dados sensíveis
- [ ] Termos de Serviço + Política de Privacidade

**Tempo Estimado: 20+ dias**

---

## 📈 Métricas de Sucesso

### KPIs para Monitorar
- ✅ Clientes criados (dia/semana/mês)
- ✅ Taxa de conversão Trial → Pro
- ✅ Churn rate (clientes que cancelam)
- ✅ NPS (Net Promoter Score)
- ✅ ARPU (Average Revenue Per User)

### Targets Iniciais
- **Mês 1**: 10 clientes trial
- **Mês 2**: 5 conversões para Pro (50% conversion)
- **Mês 3**: 30 clientes totais, R$ 500/mês MRR

---

## 🎯 Checklist Diário

### Development
- [ ] Rodar testes (se houver)
- [ ] Verificar logs de erro
- [ ] Validar consumo de API Gemini
- [ ] Backup do banco de dados

### Marketing
- [ ] Postar exemplo de cliente criado no LinkedIn
- [ ] Responder dúvidas em comunidades
- [ ] Coletar feedback de clientes

### DevOps
- [ ] Monitorar uptime
- [ ] Analisar performance de consultas
- [ ] Validar segurança das chaves

---

## 💡 Arquitetura Final (Visão)

```
┌─────────────────┐
│   CLIENTE       │
│  (WhatsApp)     │
└────────┬────────┘
         │
         ↓
┌─────────────────┐     ┌──────────────┐
│  NODE.js Server │────→│  Gemini 3    │
│  (port 3000)    │     │  Flash API   │
└────────┬────────┘     └──────────────┘
         │
         ↓
    ┌────────────┐
    │ SQLite/PG  │
    │  (dados)   │
    └────────────┘
         │
    ┌────┴────┐
    │          │
┌───▼──┐  ┌───▼──┐
│Users │  │Msgs  │
└──────┘  └──────┘
```

---

## 🚀 Deploy

### Ambiente Local (Desenvolvimento)
```bash
npm install
npm start
# Acessa em http://localhost:3000
```

### Ambiente Production
```bash
# Via Railway / Heroku / AWS
npm run build
npm start --production
```

---

**Última Atualização**: 23/05/2026
**Status**: Fase 1 ✅ Completa | Fase 2 🚀 Em Breve
