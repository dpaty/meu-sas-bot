const express = require('express');
const router = express.Router();
const db = require('../database/db');

// 🔧 ROTA: GET /api/config - Carregar configuração do usuário
router.get('/config', async (req, res) => {
    try {
        // Por enquanto, pega o usuário padrão (você pode adicionar autenticação depois)
        const userId = req.query.userId || 'default-user';
        
        const user = await db.getUser(userId);
        
        if (!user) {
            return res.json({
                id: userId,
                company_name: '',
                business_segment: '',
                ai_name: '',
                personality_type: 'friendly',
                catalog_prices: '',
                faq_data: '',
                uploaded_context: '',
                extra_details: '',
                plan_type: 'trial',
                plan_limit: 300,
                used_messages: 0,
                expires_at: null
            });
        }
        
        res.json({
            id: user.id,
            company_name: user.company_name || '',
            business_segment: user.business_segment || '',
            ai_name: user.ai_name || '',
            personality_type: user.personality_type || 'friendly',
            catalog_prices: user.catalog_prices || '',
            faq_data: user.faq_data || '',
            uploaded_context: user.uploaded_context || '',
            extra_details: user.extra_details || '',
            plan_type: user.plan_type || 'trial',
            plan_limit: user.plan_limit || 300,
            used_messages: user.used_messages || 0,
            expires_at: user.expires_at || null
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 💾 ROTA: POST /api/config - Salvar configuração do usuário
router.post('/config', async (req, res) => {
    try {
        const userId = req.query.userId || 'default-user';
        const {
            company_name,
            business_segment,
            ai_name,
            personality_type,
            catalog_prices,
            faq_data,
            uploaded_context,
            extra_details,
            plan_type,
            plan_limit
        } = req.body;
        
        // Calcular nova data de expiração (7 dias a partir de agora)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        
        const configData = {
            id: userId,
            company_name: company_name || '',
            business_segment: business_segment || '',
            ai_name: ai_name || '',
            personality_type: personality_type || 'friendly',
            catalog_prices: catalog_prices || '',
            faq_data: faq_data || '',
            uploaded_context: uploaded_context || '',
            extra_details: extra_details || '',
            plan_type: plan_type || 'trial',
            plan_limit: plan_limit || 300,
            expires_at: expiresAt.toISOString(),
            groq_key: process.env.MASTER_GEMINI_KEY,
            use_ai: 1
        };
        
        await db.saveUser(configData);
        
        res.json({
            success: true,
            message: 'Configuração salva com sucesso',
            config: configData
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 📊 ROTA: GET /api/config/stats - Estatísticas do usuário
router.get('/config/stats', async (req, res) => {
    try {
        const userId = req.query.userId || 'default-user';
        const user = await db.getUser(userId);
        
        if (!user) {
            return res.json({
                plan_type: 'trial',
                used_messages: 0,
                plan_limit: 300,
                percent_used: 0,
                expires_at: null,
                days_left: 7
            });
        }
        
        const now = new Date();
        const expiresAt = user.expires_at ? new Date(user.expires_at) : null;
        const daysLeft = expiresAt ? Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24)) : 0;
        const percentUsed = user.plan_limit ? Math.min((user.used_messages / user.plan_limit) * 100, 100) : 0;
        
        res.json({
            plan_type: user.plan_type || 'trial',
            used_messages: user.used_messages || 0,
            plan_limit: user.plan_limit || 300,
            percent_used: parseFloat(percentUsed.toFixed(1)),
            expires_at: user.expires_at,
            days_left: Math.max(daysLeft, 0)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 🔄 ROTA: POST /api/config/reset - Resetar contador de mensagens
router.post('/config/reset', async (req, res) => {
    try {
        const userId = req.query.userId || 'default-user';
        
        // Nota: Esta é apenas uma rota de exemplo. Na produção, adicione autenticação
        const user = await db.getUser(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        
        // Resetar contador
        await db.db.run(`UPDATE users SET used_messages = 0 WHERE id = ?`, [userId]);
        
        res.json({ success: true, message: 'Contador resetado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
