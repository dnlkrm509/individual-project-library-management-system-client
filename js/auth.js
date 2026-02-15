const hostname = window.location.hostname;

const isLocal =
  hostname === "localhost" ||
  hostname === "127.0.0.1" ||
  hostname === "::1" ||
  hostname.startsWith("192.168.") ||
  hostname.startsWith("10.");

let API_BASE_URL;

if (isLocal) {
  API_BASE_URL = "http://localhost:8080";
} else {
  API_BASE_URL = "https://individual-project-library-management.onrender.com";
}

async function login() {
    try {
        const password = document.getElementById('password').value;
        const email = document.getElementById('email').value;

        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                password: password,
                email: email
            })
        });
        if (!response.ok) {
            throw new Error('Failed to login.');
        }

        const loginData = await response.json();
        localStorage.setItem('token', loginData.token);
        window.location.href = '../shop/resources.html';

    } catch (error) {}
};

async function signup() {
    try {
        const password = document.getElementById('password').value;
        const email = document.getElementById('email').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        const response = await fetch(`${API_BASE_URL}/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                password: password,
                email: email,
                confirmPassword
            })
        });

        if (!response.ok) {
            throw new Error('Failed to login.');
        }

        window.location.href = './login.html';

    } catch (error) {}
};

async function reset() {
    try {
        const email = document.getElementById('email').value;

        const response = await fetch(`${API_BASE_URL}/reset`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email
            })
        });
        if (!response.ok) {
            throw new Error('Failed to reset.');
        }

        const resetData = await response.json();
        window.location.href = '../shop/resources.html';

    } catch (error) {}
};

async function newPassword() {
    try {
        const params = new URLSearchParams(window.location.search);
        const userId = params.get('userId');
        const token = params.get('token');
        const password = document.getElementById('password').value;

        const response = await fetch(`${API_BASE_URL}/new-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId,
                token,
                password: password
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error('Failed to set new password.');
        }

        if (response.ok) {
            window.location.href = data.redirectUrl;
        } else {
            alert(data.message || 'Something went wrong.');
        }

    } catch (error) {}
};