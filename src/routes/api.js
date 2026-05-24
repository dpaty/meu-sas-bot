const express = require('express');
const router = express.Router();
const db = require('../database/db');
const instanceManager = require('../core/InstanceManager');

// ─────────────────────────────────────────────────
// INSTÂNCIAS WHATSAPP
// ─────────────────────────────────────────────────

// 1. Listar Instâncias Ativas
router.get('/instances', (req, res) => {
    // instances é um Map — usar .entries()
    const instances = [...instanceManager.instances.entries()].map(([name, data]) => ({
        name,
        status: data.status || 'online'
    }));
    res.json({ instances });
});

// 2. Criar/Iniciar Instância
router.post('/instances/create', async (req, res) => {
    try {
        const { instanceName } = req.body;
        if (!instanceName || instanceName.trim() === '') {
            return res.status(400).json({ success: false, message: 'Nome da instância é obrigatório.' });
        }
        const io = req.app.get('io');

        // Dispara sem bloquear — o QR chega via Socket.io
        instanceManager.initUser(instanceName.trim(), io).catch(err => {
            console.error(`[API] Erro ao inicializar ${instanceName}:`, err.message);
        });

        res.json({ success: true, message: 'Instância em inicialização. Aguarde o QR Code.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 3. Desconectar Instância
router.post('/instances/:name/disconnect', async (req, res) => {
    try {
        const { name } = req.params;
        if (instanceManager.instances.has(name)) {
            const inst = instanceManager.instances.get(name);
            await inst.client.logout();
            instanceManager.instances.delete(name);
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─────────────────────────────────────────────────
// MENSAGENS
// ─────────────────────────────────────────────────

// 4. Listar Últimas Mensagens
router.get('/messages', async (req, res) => {
    try {
        const messages = await db.getMessages();
        res.json({ messages });
    } catch (err) {
        res.status(500).json({ messages: [], error: err.message });
    }
});

// ─────────────────────────────────────────────────
// CONFIGURAÇÃO DO CLIENTE (FASE 2)
// ─────────────────────────────────────────────────

// 5. Salvar Configuração Completa do Agente
router.post('/config/save', async (req, res) => {
    try {
        const {
            userId, company_name, business_segment, ai_name,
            personality_type, system_prompt,
            catalog_prices, faq_data, uploaded_context, extra_details
        } = req.body;

        if (!userId || userId.trim() === '') {
            return res.status(400).json({ success: false, message: 'userId é obrigatório.' });
        }

        const masterKey = process.env.MASTER_GEMINI_KEY;
        if (!masterKey || masterKey === 'cole_sua_chave_aqui') {
            return res.status(500).json({ success: false, message: 'MASTER_GEMINI_KEY não configurada no servidor.' });
        }

        // Busca config existente para não sobrescrever trial já iniciado
        const existing = await db.getUser(userId.trim()).catch(() => null);

        // Se novo usuário: define trial de 7 dias. Se existente: mantém datas e contador.
        const expiresAt = existing?.expires_at
            ? existing.expires_at
            : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

        const planLimit  = existing?.plan_limit  ?? 300;
        const planType   = existing?.plan_type   ?? 'trial';

        await db.saveUser({
            id: userId.trim(),
            company_name:      company_name      || '',
            business_segment:  business_segment  || '',
            ai_name:           ai_name           || 'Sâmara',
            personality_type:  personality_type  || 'friendly',
            system_prompt:     system_prompt     || '',
            catalog_prices:    catalog_prices    || '',
            faq_data:          faq_data          || '',
            uploaded_context:  uploaded_context  || '',
            extra_details:     extra_details     || '',
            plan_type:  planType,
            plan_limit: planLimit,
            expires_at: expiresAt,
            groq_key:   masterKey,   // Sempre a chave mestra — cliente nunca vê
            ai_model:   'gemini-3-flash-preview',
            use_ai:     1
        });

        res.json({ success: true, message: 'Configuração salva com sucesso!' });

    } catch (err) {
        console.error('[API] Erro ao salvar config:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

// 6. Carregar Configuração do Agente (para edição)
router.get('/config/:userId', async (req, res) => {
    try {
        const user = await db.getUser(req.params.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
        }

        // Remove groq_key da resposta — chave mestra nunca sai do servidor
        const { groq_key, ...safeUser } = user;
        res.json({ success: true, config: safeUser });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 7. Stats do Trial (para o banner de consumo)
router.get('/stats/:userId', async (req, res) => {
    try {
        const user = await db.getUser(req.params.userId);
        if (!user) {
            return res.status(404).json({ success: false });
        }

        const now = new Date();
        const expires = user.expires_at ? new Date(user.expires_at) : null;
        const isExpired = expires ? now > expires : false;

        res.json({
            success: true,
            used_messages: user.used_messages || 0,
            plan_limit:    user.plan_limit    || 300,
            plan_type:     user.plan_type     || 'trial',
            expires_at:    user.expires_at    || null,
            is_expired:    isExpired
        });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;