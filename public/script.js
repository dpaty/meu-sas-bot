// Conexão com o servidor via Socket.io
const socket = io();

// Seleção de elementos da interface
const btnConnect = document.getElementById('btnConnect');
const userIdInput = document.getElementById('userId');
const groqKeyInput = document.getElementById('groqKey');
const promptInput = document.getElementById('prompt');
const qrContainer = document.getElementById('qr-container');
const statusBadge = document.getElementById('statusBadge');

/**
 * Função principal para ativar o agente
 */
btnConnect.addEventListener('click', async () => {
    const userId = userIdInput.value.trim();
    const groqKey = groqKeyInput.value.trim();
    const prompt = promptInput.value.trim();

    // Validação básica
    if (!userId || !groqKey) {
        alert("⚠️ Por favor, preencha o ID da Instância e a Chave Gemini.");
        return;
    }

    // Feedback visual de processamento
    btnConnect.disabled = true;
    btnConnect.innerText = "⏳ Inicializando Motor...";
    qrContainer.innerHTML = '<p style="color: #94a3b8;">Solicitando QR Code ao servidor...</p>';

    try {
        // PASSO 1: Salvar as configurações no Banco de Dados (SQLite)
        const resConfig = await fetch('/api/config/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, groqKey, prompt })
        });

        if (!resConfig.ok) {
            const errorData = await resConfig.json();
            throw new Error(errorData.error || "Erro ao salvar configurações.");
        }

        // PASSO 2: Entrar na sala do Socket para receber o QR Code desta instância
        socket.emit('join', userId);
        console.log(`[SOCKET] Inscrito na sala: ${userId}`);

        // PASSO 3: Iniciar a conexão do WhatsApp no servidor
        const resInit = await fetch('/api/instance/init', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });

        if (!resInit.ok) {
            const errorData = await resInit.json();
            throw new Error(errorData.error || "Erro ao iniciar instância.");
        }

        console.log("✅ Solicitação de inicialização enviada com sucesso!");

    } catch (error) {
        // Se der erro (incluindo o erro de sessão/JSON), cai aqui
        console.error("Erro no processo:", error);
        alert("❌ " + error.message);
        
        // Reseta o botão para o usuário tentar de novo
        btnConnect.disabled = false;
        btnConnect.innerText = "Ativar Agente e Gerar Conexão";
        qrContainer.innerHTML = '<p style="color: #ef4444;">Falha na conexão.</p>';
    }
});

/**
 * LISTENERS DO SOCKET (Recebendo dados do servidor)
 */

// 1. Receber o QR Code para exibir na tela
socket.on('qr', (qr) => {
    console.log("[SOCKET] QR Code recebido");
    qrContainer.innerHTML = `
        <p style="margin-bottom: 10px; font-size: 0.9rem; color: #3b82f6;">Escaneie o código abaixo:</p>
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qr)}" alt="WhatsApp QR Code">
    `;
    
    btnConnect.innerText = "Aguardando Leitura...";
});

// 2. Receber atualização de status (Conectado/Desconectado)
socket.on('status', (status) => {
    console.log("[SOCKET] Status atualizado:", status);
    
    if (status.conectado) {
        // Atualiza a Badge de Status
        statusBadge.innerText = "● Online";
        statusBadge.classList.add('status-online');
        
        // Atualiza o container do QR
        qrContainer.innerHTML = `
            <div style="text-align: center;">
                <h3 style="color: #22c55e;">✅ Conectado!</h3>
                <p style="color: #94a3b8; font-size: 0.8rem;">O agente está operando neste WhatsApp.</p>
            </div>
        `;
        
        // Libera o botão para futuras atualizações de prompt
        btnConnect.disabled = false;
        btnConnect.innerText = "Atualizar Configurações";
    } else {
        statusBadge.innerText = "● Desconectado";
        statusBadge.classList.remove('status-online');
    }
});