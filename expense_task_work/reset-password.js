const API_URL = "http://localhost:3000";
const resetForm = document.getElementById("resetPasswordForm");
const resetMessage = document.getElementById("resetMessage");
const resetButton = document.getElementById("resetButton");
const loginLink = document.getElementById("loginLink");
const requestId = window.location.pathname.split("/").filter(Boolean).pop();

resetForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const password = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password.length < 8) {
        resetMessage.textContent = "Password must be at least 8 characters long.";
        resetMessage.style.color = "#ffd4d4";
        return;
    }
    if (password !== confirmPassword) {
        resetMessage.textContent = "Passwords do not match.";
        resetMessage.style.color = "#ffd4d4";
        return;
    }

    resetButton.disabled = true;
    resetMessage.textContent = "Updating password…";
    resetMessage.style.color = "#fff";

    try {
        const response = await fetch(`${API_URL}/password/resetpassword/${encodeURIComponent(requestId)}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Unable to reset password.");

        resetMessage.textContent = result.message;
        resetMessage.style.color = "#d7ffd7";
        resetForm.hidden = true;
        loginLink.hidden = false;
    } catch (error) {
        resetMessage.textContent = error.message || "Unable to reset password. Please request a new link.";
        resetMessage.style.color = "#ffd4d4";
    } finally {
        resetButton.disabled = false;
    }
});
