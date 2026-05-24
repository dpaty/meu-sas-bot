document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('password').value;
    
    const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
    });

    if (res.ok) {
        window.location.href = '/dashboard.html'; // Redireciona para o painel
    } else {
        alert("Senha incorreta!");
    }
});