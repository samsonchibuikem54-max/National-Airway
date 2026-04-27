const BACKEND_URL = "https://YOUR-BACKEND-URL.onrender.com"; // change after deploy

// ---------------- ADMIN LOGIN ----------------
const adminLoginForm = document.querySelector("#adminLoginForm");

if (adminLoginForm) {
  adminLoginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.querySelector("#adminEmail").value;
    const password = document.querySelector("#adminPassword").value;

    try {
      const res = await fetch(`${BACKEND_URL}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || "Login failed");
        return;
      }

      // ✅ SAVE TOKEN
      localStorage.setItem("adminToken", data.token);

      alert("Login successful!");
      window.location.href = "admin_dashboard.html";

    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  });
}


// ---------------- FORGOT PASSWORD ----------------
const forgotPasswordForm = document.querySelector("#forgotPasswordForm");

if (forgotPasswordForm) {
  forgotPasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.querySelector("#forgotEmail").value;

    try {
      const res = await fetch(`${BACKEND_URL}/admin/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      alert(data.message || data.error);

    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  });
}


// ---------------- PAYMENT SUBMIT ----------------
const paymentForm = document.querySelector("#paymentForm");

if (paymentForm) {
  paymentForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.querySelector("#paymentName").value;
    const email = document.querySelector("#paymentEmail").value;
    const amount = document.querySelector("#paymentAmount").value;
    const method = document.querySelector("#paymentMethod").value;

    try {
      const res = await fetch(`${BACKEND_URL}/payment/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, amount, method }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || "Payment failed");
        return;
      }

      alert("Payment submitted successfully!");

      paymentForm.reset();

    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  });
}