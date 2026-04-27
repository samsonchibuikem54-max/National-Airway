// admin_login.js
import { BACKEND_URL } from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("loginBtn");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  if (!loginBtn || !emailInput || !passwordInput) {
    console.error("Admin login elements not found in DOM");
    return;
  }

  loginBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      alert("Fill in all fields.");
      return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = "Logging in...";

    try {
      const response = await fetch(`${BACKEND_URL}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Login failed");
      }

      // ✅ SAVE JWT
      localStorage.setItem("adminToken", result.token);
      localStorage.setItem("adminEmail", email);
      localStorage.setItem("adminLoginTime", Date.now());

      // ✅ REDIRECT
      window.location.href = "admin_dashboard.html";

    } catch (err) {
      console.error("Login error:", err);
      alert(err.message);
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = "Login";
    }
  });
});
