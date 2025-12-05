import { readCookie, createLoader, closeLoader} from './utils.js';
document.addEventListener('DOMContentLoaded', function () {
const registerBtn = document.getElementById('register-btn');
        const errorMsg = document.getElementById('error-msg');
        const emailInput = document.getElementById('email');
        const mobileInput = document.getElementById('mobile');
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirm-password');
        const termsCheckbox = document.getElementById('terms-checkbox');
        const showPasswordBtn = document.getElementById('show-password-btn');
        const showConfirmPasswordBtn = document.getElementById('show-confirm-password-btn');

        showPasswordBtn.addEventListener('click', function () {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                showPasswordBtn.innerHTML = '<span class="material-symbols-outlined text-2xl">visibility</span>';
            } else {
                passwordInput.type = 'password';
                showPasswordBtn.innerHTML = '<span class="material-symbols-outlined text-2xl">visibility_off</span>';
            }
        });

        showConfirmPasswordBtn.addEventListener('click', function () {
            if (confirmPasswordInput.type === 'password') {
                confirmPasswordInput.type = 'text';
                showConfirmPasswordBtn.innerHTML = '<span class="material-symbols-outlined text-2xl">visibility</span>';
            } else {
                confirmPasswordInput.type = 'password';
                showConfirmPasswordBtn.innerHTML = '<span class="material-symbols-outlined text-2xl">visibility_off</span>';
            }
        });

        function validateForm() {
            const email = emailInput.value.trim();
            const mobile = mobileInput.value.trim();
            const password = passwordInput.value.trim();
            const confirmPassword = confirmPasswordInput.value.trim();
            const termsAccepted = termsCheckbox.checked;

            if (!email || !mobile || !password || !confirmPassword) {
                errorMsg.textContent = 'Please fill in all fields.';
                return false;
            }

            if (password !== confirmPassword) {
                errorMsg.textContent = 'Passwords do not match.';
                return false;
            }

            if (!/^[0-9]{10}$/.test(mobile)) {
                errorMsg.textContent = 'Mobile number should contain 10 digits.';
                return false;
            }

            if (!/^[0-9]{10}$/.test(mobile) || !/^[789]/.test(mobile)) {
                errorMsg.textContent = 'Mobile number should start with 7, 8, or 9.';
                return false;
            }

            if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
                errorMsg.textContent = 'Please enter a valid email address.';
                return false;
            }

            if (!termsAccepted) {
                errorMsg.textContent = 'Terms should be accepted before registration.';
                return false;
            }

            return true;
        }

        registerBtn.addEventListener('click', function (event) {
            event.preventDefault();
            if (validateForm()) {
                errorMsg.textContent = '';
                const loader = createLoader();
                const email = emailInput.value.trim();
                const mobile = mobileInput.value.trim();
                const password = passwordInput.value.trim();

                fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, mobile, password })
                })
                .then(response => response.json())
                .then(data => {
                    closeLoader(loader);
                    if (data.success) {
                        window.location.href = `/verify.html?email=${encodeURIComponent(email)}`;
                    } else {
                        errorMsg.textContent = data.message;
                    }
                })
                .catch(err => {
                    closeLoader(loader);
                    console.error('Registration error:', err);
                    errorMsg.textContent = 'An error occurred during registration.';
                });
            }
        });
});