document.addEventListener('DOMContentLoaded', () => {
    // Verificar se já está logado
    if (localStorage.getItem('userId')) {
        window.location.href = 'dashboard.html';
    }

    const loginSection = document.getElementById('login-section');
    const registerSection = document.getElementById('register-section');
    
    // Alternar formulários
    document.getElementById('go-to-register').addEventListener('click', (e) => {
        e.preventDefault();
        loginSection.classList.add('hidden');
        registerSection.classList.remove('hidden');
    });

    document.getElementById('go-to-login').addEventListener('click', (e) => {
        e.preventDefault();
        registerSection.classList.add('hidden');
        loginSection.classList.remove('hidden');
    });

    // Validação de Senha Regra
    function validatePassword(password) {
        // Exige 8+ chars, 1 minúscula, 1 maiúscula, 1 número e 1 caractere especial (qualquer um não alfanumérico)
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
        return regex.test(password);
    }

    // Login Form Submit
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const errorDiv = document.getElementById('login-error');
        errorDiv.textContent = '';

        try {
            const res = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            
            if (res.ok) {
                localStorage.setItem('userId', data.id);
                window.location.href = 'dashboard.html';
            } else {
                errorDiv.textContent = data.error;
            }
        } catch (err) {
            errorDiv.textContent = 'Erro ao conectar ao servidor.';
        }
    });

    // Register Form Submit
    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const errorDiv = document.getElementById('reg-error');
        errorDiv.textContent = '';

        if (!validatePassword(password)) {
            errorDiv.textContent = 'A senha não atende aos requisitos: mínimo 8 caracteres, maiúsculas, minúsculas, números e especiais.';
            return;
        }

        try {
            const res = await fetch('http://localhost:3000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            
            if (res.ok) {
                localStorage.setItem('userId', data.id);
                window.location.href = 'dashboard.html';
            } else {
                errorDiv.textContent = data.error;
            }
        } catch (err) {
            errorDiv.textContent = 'Erro ao conectar ao servidor.';
        }
    });
});
