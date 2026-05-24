const express = require('express');
const router = express.Router();

router.post('/login', (req, res) => {
    const { password } = req.body;
    const masterPassword = process.env.DASHBOARD_PASSWORD || 'admin123';

    if (password === masterPassword) {
        req.session.authenticated = true;
        return res.json({ success: true });
    }
    res.status(401).json({ error: "Senha incorreta" });
});

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login.html');
});

module.exports = router;