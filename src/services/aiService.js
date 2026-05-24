const { GoogleGenerativeAI } = require("@google/generative-ai");
const db = require("../database/db");

// Buffer de memória para manter o contexto das conversas
const chatMemory = {}; 

// 🎨 PERSONALIDADES DA IA - Definem o "DNA" do comportamento
const PERSONALITIES = {
    professional: {
        description: "Tom de voz formal, direto e executivo. Evita gírias, usa pontuação perfeita e foca em eficiência e credibilidade.",
        temperature: 0.5
    },
    friendly: {
        description: "Tom de voz caloroso, empático e acolhedor. Usa emojis moderadamente, demonstra preocupação com o bem-estar do cliente e é muito educado.",
        temperature: 0.6
    },
    creative: {
        description: "Tom de voz relaxado, autêntico e levemente humorado. Usa gírias leves (se condizente), é muito conversacional e foca em criar conexão real.",
        temperature: 0.8
    }
};

class AIService {
    constructor() {
        this.genAI = null;
    }

    initClient(apiKey) {
        if (!this.genAI) {
            this.genAI = new GoogleGenerativeAI(apiKey);
        }
    }

    async getResponse(userId, chatId, message, userConfig) {
        try {
            this.initClient(userConfig.groq_key);
            
            // ⚠️ PASSO 1: VERIFICAÇÃO DA ISCA GRATUITA (Trava de Segurança)
            const userDb = await db.getUser(userId);
            
            if (!userDb) {
                return "❌ Unidade de atendimento não configurada. Por favor, configure sua conta no dashboard.";
            }

            // Verificar limite de mensagens
            if (userDb.used_messages >= (userDb.plan_limit || 300)) {
                return `⚠️ [Alerta do Sistema] O limite de mensagens do plano de testes da empresa ${userDb.company_name || 'não nomeada'} foi atingido. Para reativar o atendimento, por favor entre em contato com o suporte.`;
            }

            // Verificar expiração do período trial
            if (userDb.expires_at) {
                const dataAtual = new Date();
                const dataExpiracao = new Date(userDb.expires_at);
                if (dataAtual > dataExpiracao) {
                    return `⚠️ [Alerta do Sistema] O período de testes gratuito da empresa ${userDb.company_name || 'não nomeada'} expirou. Entre em contato com o administrador para migrar para o plano Pro.`;
                }
            }

            // ✅ PASSO 2: CONSTRUÇÃO DO CONTEXTO CORPORATIVO AVANÇADO
            const aiName = userDb.ai_name || 'Assistente Virtual';
            const personalityType = userDb.personality_type || 'professional';
            const personality = PERSONALITIES[personalityType] || PERSONALITIES.professional;
            
            const systemInstruction = `
Você é **${aiName}**, o assistente virtual oficial da empresa "${userDb.company_name || 'Empresa'}".

📊 **RAMO DE NEGÓCIO:** ${userDb.business_segment || 'Não especificado'}

🎭 **PERSONALIDADE & TOM DE VOZ:**
${personality.description}

${userDb.extra_details ? `\n📝 **DETALHES E CONTEXTO ADICIONAIS:**\n${userDb.extra_details}` : ''}

${userDb.catalog_prices ? `\n💰 **TABELA DE PREÇOS E PRODUTOS OFICIAIS:**\n${userDb.catalog_prices}` : ''}

${userDb.faq_data ? `\n❓ **PERGUNTAS FREQUENTES E RESPOSTAS:**\n${userDb.faq_data}` : ''}

${userDb.uploaded_context ? `\n📚 **CONHECIMENTO ADICIONAL:**\n${userDb.uploaded_context}` : ''}

${userDb.system_prompt ? `\n⚙️ **INSTRUÇÕES ESPECÍFICAS DO CLIENTE:**\n${userDb.system_prompt}` : ''}

---
🔴 **REGRAS DE OURO PARA HUMANIZAÇÃO:**
1. Nunca diga "Sou uma IA" a menos que seja estritamente necessário.
2. Se o cliente estiver bravo ou frustrado, use empatia profunda.
3. Se não souber algo que não está no conhecimento acima, NÃO INVENTE. Diga educadamente que vai confirmar com a equipe humana.
4. Mantenha as respostas curtas e fáceis de ler no WhatsApp (máximo 300 caracteres por mensagem).
5. Use informações APENAS da base de conhecimento acima. Se perguntarem sobre preços/condições, use a Tabela Oficial.
`;

            // 🤖 PASSO 3: CHAMADA AO GEMINI 3 FLASH PREVIEW
            const model = this.genAI.getGenerativeModel({ 
                model: "gemini-3-flash-preview" 
            });

            // 1. Gerenciar Memória
            if (!chatMemory[chatId]) {
                chatMemory[chatId] = [];
            }

            // 2. Formatar o histórico (Padrão Gemini)
            const history = chatMemory[chatId].map(msg => ({
                role: msg.role === "assistant" ? "model" : "user",
                parts: [{ text: msg.content }],
            }));

            // 3. Iniciar o chat
            const chat = model.startChat({
                history: history,
                generationConfig: {
                    maxOutputTokens: 1024,
                    temperature: personality.temperature,
                },
            });

            // Injetamos o prompt de sistema consolidado
            const promptFinal = `${systemInstruction}\n\n📨 Mensagem do Cliente: ${message}`;

            // 4. Enviar mensagem e aguardar resposta
            const result = await chat.sendMessage(promptFinal);
            const response = await result.response;
            const aiResponse = response.text();

            // 5. PASSO 4: ATUALIZAR BANCO DE DADOS (Taxímetro)
            await db.incrementMessageCounter(userId); // Soma +1 no consumo
            await db.saveMessage(chatId, message, aiResponse); // Salva histórico

            // 6. Atualizar Memória Local
            chatMemory[chatId].push({ role: "user", content: message });
            chatMemory[chatId].push({ role: "assistant", content: aiResponse });

            // Mantém as últimas 10 mensagens para não gastar tokens à toa
            if (chatMemory[chatId].length > 10) chatMemory[chatId].splice(0, 2);

            return aiResponse;

        } catch (error) {
            console.error(`[GEMINI 3 FLASH ERROR] ${userId}:`, error.message);
            return "Tive um erro técnico na nova engine. Pode repetir sua pergunta?";
        }
    }
}

module.exports = new AIService();