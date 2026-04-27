import { BACKEND_URL } from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
  const resetBtn = document.getElementById("resetBtn");
  const newPasswordInput = document.getElementById("newPassword");
  const confirmPasswordInput = document.getElementById("confirmPassword");

  // Extract token from URL
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");
  if (!token) {
    alert("No reset token provided");
    window.location.href = "admin_login.html";
    return;
  }

  resetBtn.addEventListener("click", async () => {
    const newPassword = newPasswordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();

    if (!newPassword || !confirmPassword) {
      alert("Please fill in both fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/admin/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to reset password");
      }

      alert(result.message || "Password reset successfully");
      window.location.href = "admin_login.html";

    } catch (err) {
      console.error(err);
      alert("Error resetting password: " + err.message);
    }
  });
});
// admin_reset_password.js