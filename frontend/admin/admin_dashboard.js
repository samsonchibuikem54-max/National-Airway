// admin_dashboard.js
import { BACKEND_URL } from "./config.js";

document.addEventListener("DOMContentLoaded", async () => {
  // ------------------ AUTH CHECK ------------------
  const token = localStorage.getItem("adminToken");
  if (!token) {
    window.location.href = "admin_login.html";
    return;
  }

  // ------------------ LOGOUT ------------------
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      logout();
    });
  }

  // ------------------ REFRESH ------------------
  const refreshBtn = document.getElementById("refreshBtn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", async () => {
      await loadPendingPayments();
    });
  }

  // ------------------ PAYMENTS TABLE ------------------
  const paymentsTable = document.getElementById("paymentsTable");

  async function loadPendingPayments() {
    try {
      const res = await fetch(`${BACKEND_URL}/payment/pending`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          logout();
          return;
        }
        throw new Error("Failed to fetch payments");
      }

      const result = await res.json();
      if (!result.success) throw new Error(result.error || "Failed to fetch payments");

      // Clear table
      paymentsTable.innerHTML = "";

      // Use fragment for performance
      const fragment = document.createDocumentFragment();

      // Populate table
      result.data.forEach((payment) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${payment.name}</td>
          <td>${payment.email || "-"}</td>
          <td>$${payment.amount}</td>
          <td>${payment.method}</td>
          <td>${payment.status}</td>
          <td>${payment.tracking_id || "-"}</td>
          <td>
            <button class="verifyBtn" data-id="${payment.id}">Verify</button>
            <button class="deleteBtn" data-id="${payment.id}">Delete</button>
          </td>
        `;
        fragment.appendChild(row);
      });

      paymentsTable.appendChild(fragment);

      // Attach event listeners AFTER populating table
      attachPaymentActions();
    } catch (err) {
      console.error("Load payments error:", err);
      alert("Error loading payments: " + err.message);
    }
  }

  // ------------------ VERIFY & DELETE BUTTONS ------------------
  function attachPaymentActions() {
    // Verify Payment
    document.querySelectorAll(".verifyBtn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;
        if (!id) return alert("Invalid payment ID");

        btn.disabled = true; // prevent multiple clicks
        try {
          const res = await fetch(`${BACKEND_URL}/payment/verify`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ id }),
          });

          const data = await res.json();
          if (!data.success) throw new Error(data.error || "Payment verification failed");

          alert(`Payment verified! Tracking ID: ${data.trackingId}`);
          await loadPendingPayments();
        } catch (err) {
          console.error("Verify error:", err);
          alert("Payment verification failed: " + err.message);
        } finally {
          btn.disabled = false;
        }
      });
    });

    // Delete Payment
    document.querySelectorAll(".deleteBtn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;
        if (!id || !confirm("Are you sure you want to delete this payment?")) return;

        btn.disabled = true;
        try {
          const res = await fetch(`${BACKEND_URL}/payment/delete`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ id }),
          });

          const data = await res.json();
          if (!data.success) throw new Error(data.error || "Delete failed");

          alert("Payment deleted successfully");
          await loadPendingPayments();
        } catch (err) {
          console.error("Delete error:", err);
          alert("Failed to delete payment: " + err.message);
        } finally {
          btn.disabled = false;
        }
      });
    });
  }

  // ------------------ LOGOUT FUNCTION ------------------
  function logout() {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminEmail");
    localStorage.removeItem("adminLoginTime");
    window.location.href = "admin_login.html";
  }

  // ------------------ INITIAL LOAD ------------------
  await loadPendingPayments();
});
