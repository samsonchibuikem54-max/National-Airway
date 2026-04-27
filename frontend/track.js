import { BACKEND_URL } from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
  const trackBtn = document.getElementById("trackBtn");
  const emailInput = document.getElementById("email");
  const result = document.getElementById("result");

  if (!trackBtn || !emailInput || !result) return;

  trackBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();

    if (!email) {
      alert("Enter your email");
      return;
    }

    result.innerHTML = "Loading...";

    try {
      const res = await fetch(
        `${BACKEND_URL}/tracking/${encodeURIComponent(email)}`
      );

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error("Invalid server response");
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Tracking failed");
      }

      if (!data.data || data.data.length === 0) {
        result.innerHTML = `<p class="text-danger mt-3">No shipment found</p>`;
        return;
      }

      const shipment = data.data[0];

      result.innerHTML = `
        <div class="card-box">
          <h5>Shipment Details</h5>

          <p><b>Name:</b> ${shipment.name}</p>
          <p><b>Email:</b> ${shipment.email}</p>
          <p><b>Amount:</b> $${shipment.amount}</p>

          <p>
            <b>Status:</b>
            <span class="status ${shipment.status}">
              ${shipment.status}
            </span>
          </p>

          <p><b>Tracking ID:</b> ${shipment.tracking_id || "Pending"}</p>
        </div>

        <div class="timeline">
          <div class="step">
            <span>Order Received</span>
            <p>Your shipment request has been received.</p>
          </div>

          <div class="step">
            <span>Payment Processing</span>
            <p>Waiting for admin verification.</p>
          </div>

          <div class="step">
            <span>Verified / Processing</span>
            <p>Admin has verified your payment.</p>
          </div>

          <div class="step">
            <span>Delivery Stage</span>
            <p>Shipment will be processed for delivery.</p>
          </div>
        </div>
      `;

    } catch (err) {
      console.error(err);
      result.innerHTML = `<p class="text-danger">Server error: ${err.message}</p>`;
    }
  });
});