// admin_register.js
import { BACKEND_URL } from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
  const registerBtn = document.getElementById("registerBtn");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  // ------------------ SAFETY CHECK ------------------
  if (!registerBtn || !emailInput || !passwordInput) {
    console.error("❌ Required register elements not found in DOM");
    return;
  }

  // ------------------ REGISTER HANDLER ------------------
  registerBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    // ------------------ VALIDATION ------------------
    if (!email || !password) {
      alert("⚠️ Email and password are required");
      return;
    }

    if (password.length < 6) {
      alert("⚠️ Password must be at least 6 characters");
      return;
    }

    const payload = { email, password };

    console.log("📤 Sending register payload:", payload);

    // ------------------ LOADING STATE ------------------
    registerBtn.disabled = true;
    registerBtn.textContent = "Registering...";

    try {
      const response = await fetch(`${BACKEND_URL}/admin/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      console.log("📥 Backend response:", data);

      // ------------------ ERROR HANDLING ------------------
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Registration failed");
      }

      // ------------------ SUCCESS ------------------
      alert("✅ Registration successful!");

      // clear inputs
      emailInput.value = "";
      passwordInput.value = "";

      // redirect to login
      window.location.href = "admin_login.html";

    } catch (err) {
      console.error("❌ Registration error:", err);
      alert("Registration failed: " + err.message);
    } finally {
      registerBtn.disabled = false;
      registerBtn.textContent = "Register";
    }
  });
});