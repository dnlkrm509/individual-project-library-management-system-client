const responseLogin = document.getElementById('response-login');
const responseSignup = document.getElementById('response-signup');
const inputDivs = document.querySelectorAll('.input-div')

async function login() {
    try {
        const password = document.getElementById('password-login').value;
        const email = document.getElementById('email-login').value;

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
        
        
        const loginData = await response.json();
        console.log(loginData);
        responseLogin.classList.remove('user-message', 'user-message--error', 'user-message--success');
        inputDivs.forEach(div => {
            const input = div.querySelector('input');
            if (input) {
                input.classList.remove('invalid');
            }
        });
        loginData.validationErrors?.forEach(error => {
            const input = document.querySelector(`.input-div input[id="${error.path}-login"]`);
            console.log(input)
            if (input) {
                input.classList.add('invalid');
            }
        });

        responseLogin.innerHTML = "";

        if (!response.ok) {
            responseLogin.classList.add('user-message', 'user-message--error');
            responseLogin.innerHTML = "HTTP error: " + response.status;
        }
        if (response.status !== 200) {
            return responseLogin.innerHTML += ", Error Message: " + loginData.errorMessage;
        } else {
            responseLogin.classList.add('user-message', 'user-message--success');
            responseLogin.innerHTML = loginData.message;
        }

        localStorage.setItem('token', loginData.token);
        let resources = "../shop/resources.html";

        if (path.endsWith("index.html") || path === "/" || path.endsWith("/")) {
         resources = "./shop/resources.html";
        }
        window.location.href = resources;

    } catch (error) {
        responseLogin.innerHTML = "HTTP error: " + error;
    }
};

async function signup() {
    try {
        const password = document.getElementById('password-signup').value;
        const email = document.getElementById('email-signup').value;
        const confirmPassword = document.getElementById('confirm-password-signup').value;

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

        const signupData = await response.json();
        console.log(signupData);
        responseSignup.classList.remove('user-message', 'user-message--error', 'user-message--success');
        inputDivs.forEach(div => {
            const input = div.querySelector('input');
            if (input) {
                input.classList.remove('invalid');
            }
        });
        signupData.validationErrors?.forEach(error => {
            const input = document.querySelector(`.input-div input[id="${error.path}-signup"]`);
            console.log(input)
            if (input) {
                input.classList.add('invalid');
            }
        });
        
        responseSignup.innerHTML = "";

        if (!response.ok) {
            responseSignup.classList.add('user-message', 'user-message--error');
            responseSignup.innerHTML = "HTTP error: " + response.status;
            
        }
        if (response.status !== 200) {
            return responseSignup.innerHTML += ", Error Message: " + signupData.errorMessage;
        } else {
            responseSignup.classList.add('user-message', 'user-message--success');
            responseSignup.innerHTML = signupData.message;
        }

        let resources = "../shop/resources.html";

        if (path.endsWith("index.html") || path === "/" || path.endsWith("/")) {
          resources = "./shop/resources.html";
        }
        window.location.href = resources;

    } catch (error) {
        responseSignup.innerHTML = "HTTP error: " + error;
    }
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
