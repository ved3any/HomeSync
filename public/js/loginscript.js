import { createCookie, readCookie, createLoader, closeLoader } from './utils.js';

document.addEventListener('DOMContentLoaded', function () {
  const registerBtn = document.getElementById('register-btn');
  const loginBtn = document.getElementById('login-btn');
  const landingPage = document.getElementById('landingpage');
  const loginPage = document.getElementById('loginpage');
  const lgnBackBtn = document.getElementById('lgnback-btn');
  const loginForm = document.querySelector('#loginpage form');
  const emailInput = document.querySelector('#loginpage input[type="email"]');
  const passwordInput = document.querySelector('#loginpage input[type="password"]');
  const loginErrorMsg = document.querySelector('#loginpage .text-red-500');

  if (!readCookie('token') || !readCookie('userId')) {
    createCookie('token', '');
    createCookie('userId', '');
  }

  registerBtn.addEventListener('click', function () {
    window.location.href = '/register';
  });

  loginBtn.addEventListener('click', function () {
    landingPage.classList.add('hidden');
    loginPage.classList.remove('hidden');
  });

  lgnBackBtn.addEventListener('click', function () {
    loginPage.classList.add('hidden');
    landingPage.classList.remove('hidden');
  });

  const loginActionBtn = document.querySelector('#loginpage button.bg-primary');
  loginActionBtn.addEventListener('click', function(event) {
      event.preventDefault();
      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();

      if (!email || !password) {
          if(loginErrorMsg) loginErrorMsg.textContent = 'Please fill in all fields.';
          return;
      }
      const loader = createLoader();
      fetch('/api/auth/login', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
      })
      .then(response => response.json())
      .then(data => {
          if (data.success) {
              createCookie('token', data.token); // Store token in a cookie
              createCookie('userId', data.userId); // Store userId in a cookie
              window.location.reload(); // Redirect to a protected dashboard page
          } else {
              closeLoader(loader);
              if(loginErrorMsg) loginErrorMsg.textContent = data.message;
          }
      })
      .catch(err => {
          console.error('Login error:', err);
          closeLoader(loader);
          if(loginErrorMsg) loginErrorMsg.textContent = 'An error occurred during login.';
      });
  });
});