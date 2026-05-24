// EXEMPLO PRÁTICO: Criar um Cliente SaaS Completo

const db = require('./src/database/db');

async function criarClienteExemplo() {
  try {
    // 📅 Data de expiração: 7 dias a partir de agora
    const dataExpiracao = new Date();
    dataExpiracao.setDate(dataExpiracao.getDate() + 7);

    // 🏢 DADOS DO CLIENTE - Barbearia Premium
    const clienteBarbearia = {
      id: 'barbearia-mariasilva-001',
      
      // 📊 Informações da Empresa
      company_name: 'Barbearia Maria Silva',
      business_segment: 'Serviços de Beleza Masculina',
      
      // 🎭 Personalidade (Escolha: professional | friendly | creative)
      personality_type: 'friendly',  // Tom acolhedor ideal para barbeariam
      ai_name: 'Sâmara',             // Nome que aparecerá nas mensagens
      
      // 💰 BLOCO 1: Tabela de Preços
      catalog_prices: `
=== TABELA DE PREÇOS - BARBEARIA MARIA SILVA ===

🔪 SERVIÇOS BÁSICOS:
• Corte de Cabelo: R$ 50,00
• Barba Completa: R$ 30,00
• Barba + Navalha: R$ 35,00
• Sobrancelha: R$ 20,00

💇 SERVIÇOS PREMIUM:
• Hidratação + Corte: R$ 80,00
• Barba Detox: R$ 45,00
• Massagem no Rosto: R$ 40,00

📦 PACOTES ESPECIAIS:
• Pacote Noivo (Corte + Barba + Massagem): R$ 130,00
• Pacote Festa (Corte + Barba completa): R$ 75,00
• Pacote Manutenção Mensal (4 cortes): R$ 180,00

💳 FORMAS DE PAGAMENTO:
Cartão de Crédito, Débito, PIX, Dinheiro
Parcelamento em até 3x sem juros (acima de R$ 150)
      `,
      
      // ❓ BLOCO 2: FAQ (Perguntas Frequentes)
      faq_data: `
=== PERGUNTAS FREQUENTES ===

P: Qual é o horário de funcionamento?
R: Segunda a Sexta: 9h às 21h
   Sábado: 9h às 18h
   Domingo: FECHADO
   Feriados: Aberto 10h às 16h

P: Vocês atendem por agendamento?
R: Tanto agendamento quanto walk-in (sem agendamento).
   Para agendamento, mande WhatsApp ou ligue.

P: Qual é o tempo médio de um corte?
R: Corte simples: 20-30 min
   Barba completa: 30-40 min
   Serviços premium: 45-60 min

P: Vocês fazem barba com navalha?
R: Sim! Barba com navalha é especialidade nossa.
   Procure por Rodrigo (17 anos de experiência).

P: Aceitam cartão?
R: Sim, todas as bandeiras! Crédito e Débito.
   Também aceitamos PIX (instantâneo).

P: Qual a localização exata?
R: Rua das Flores, 123 - Centro
   Ao lado da Farmácia Popular
   Estacionamento gratuito na rua.

P: É possível agendar para grupos?
R: Sim! Grupos acima de 5 pessoas ganham 10% de desconto.
   Agende com antecedência (fale com a Maria).
      `,
      
      // 📚 BLOCO 3: Contexto Adicional (pode ser conteúdo de TXT/Arquivo)
      uploaded_context: `
=== INFORMAÇÕES ADICIONAIS ===

SOBRE A BARBEARIA:
• Fundada em 2009 por Maria Silva
• 15 anos de excelência em cortes masculinos
• Referência regional em técnicas tradicionais + modernas
• Equipe de 5 barbeiros especializados

DIFERENCIAIS:
✓ Ambiente climatizado e confortável
✓ Wi-Fi gratuito durante o atendimento
✓ Café e chás a vontade
✓ Revista e jornais na sala de espera
✓ Sanitização rigorosa de instrumentos
✓ Clientes VIP com lounge exclusivo

PROMOÇÕES VIGENTES:
• Primeira visita: 15% de desconto no corte
• Aniversariante: Cortesia na barba com navalha
• Cliente fiel: 4 cortes = 5º grátis
• Black Friday: 25% off em todos os serviços (até 30 de nov)

INSTAGRAM: @barbearia.mariasilva
TELEFONE: (11) 98765-4321
      `,
      
      // 🎯 BLOCO 4: Detalhes Humanizados (Conhecimento interno)
      extra_details: `
Dona: Maria Silva Oliveira
Experiência: 22 anos no ramo
Especialidade: Cortes clássicos e modernos
Barbeiro destaque: Rodrigo (especialista em barbas com navalha)
Público-alvo: Clientes de 18 a 65 anos
Estilo: Profissional + caloroso
Objetivo: Ser a melhor barbearia do bairro em 2025
      `,
      
      // ⚡ CONFIGURAÇÃO DE ISCA GRATUITA
      plan_type: 'trial',              // trial = Plano Gratuito de Teste
      plan_limit: 300,                 // Limite: 300 mensagens no trial
      used_messages: 0,                // Começar do 0
      expires_at: dataExpiracao.toISOString(),  // 7 dias de teste
      
      // 🔑 CHAVES E CONFIGURAÇÕES
      system_prompt: 'Tome decisões sempre visando satisfação do cliente. Se não souber algo, peça para falar com a Maria na loja.',
      groq_key: process.env.MASTER_GEMINI_KEY,  // ← Usar a Master Key do .env
      ai_model: 'gemini-3-flash-preview',
      use_ai: 1
    };

    // 💾 SALVAR NO BANCO
    console.log('📝 Salvando novo cliente...');
    await db.saveUser(clienteBarbearia);
    console.log('✅ Cliente criado com sucesso!');
    console.log(`\n🎉 SaaS pronto para: ${clienteBarbearia.company_name}`);
    console.log(`📊 Limite: ${clienteBarbearia.plan_limit} mensagens`);
    console.log(`⏰ Expira em: ${clienteBarbearia.expires_at}`);
    console.log(`🎭 Personalidade: ${clienteBarbearia.personality_type}`);
    console.log(`🤖 IA Nome: ${clienteBarbearia.ai_name}`);

  } catch (error) {
    console.error('❌ Erro ao criar cliente:', error.message);
  }
}

// RODANDO O EXEMPLO
criarClienteExemplo();

// ========================================
// PRÓXIMO PASSO: Testar a Conversa
// ========================================
// Quando o usuário enviar uma mensagem pelo WhatsApp:
// 1. O sistema busca os dados da Barbearia Maria Silva
// 2. Verifica se tem créditos (300 - usado)
// 3. Monta o SYSTEM_INSTRUCTION com os 4 blocos
// 4. Chama Gemini 3 Flash
// 5. Retorna resposta "como Sâmara"
// 6. Incrementa o contador
//
// Resultado: Cliente vê uma IA que "conhece" a barbearia
// perfeitamente, com preços corretos e tom amigável.
// Parecer profissional = quer pagar pelo plano Pro! 🚀
