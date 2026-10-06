
const API_URL = "http://localhost:3000";
const loginForm = document.getElementById("loginForm");
const forgotPasswordForm = document.getElementById("forgotPasswordForm");
const forgotPasswordButton = document.getElementById("forgotPasswordButton");
const backToLoginButton = document.getElementById("backToLoginButton");
const message = document.getElementById("message");

function showMessage(text, color = "#fff") {
    message.textContent = text;
    message.style.color = color;
}

forgotPasswordButton.addEventListener("click", () => {
    loginForm.hidden = true;
    forgotPasswordButton.hidden = true;
    forgotPasswordForm.hidden = false;
    document.getElementById("forgotEmail").value = document.getElementById("email").value.trim();
    showMessage("");
});

backToLoginButton.addEventListener("click", () => {
    forgotPasswordForm.hidden = true;
    loginForm.hidden = false;
    forgotPasswordButton.hidden = false;
    showMessage("");
});

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const button = loginForm.querySelector('button[type="submit"]');
    button.disabled = true;
    showMessage("Signing in…");

    try {
        const response = await axios.post(
    `${API_URL}/api/auth/login`,
    { email, password }
);
        const result = response.data;
        localStorage.setItem("token", result.token);
        localStorage.setItem("user", JSON.stringify(result.user));
        showMessage("Login successful!", "#d7ffd7");
        window.setTimeout(() => { window.location.href = "Expense.html"; }, 500);
    } catch (error) {
        showMessage(error.response?.data?.message || "Unable to connect to server", "#ffd4d4");
    } finally {
        button.disabled = false;
    }
});

forgotPasswordForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("forgotEmail").value.trim();
    const button = document.getElementById("sendResetEmailButton");
    button.disabled = true;
    showMessage("Sending email…");

    try {
        const response = await axios.post(
    `${API_URL}/password/forgotpassword`,
    { email }
);
        showMessage(response.data.message || "Check your email for password assistance.", "#d7ffd7");
    } catch (error) {
        showMessage(error.response?.data?.message || "Unable to send email. Please try again later.", "#ffd4d4");
    } finally {
        button.disabled = false;
    }
});
