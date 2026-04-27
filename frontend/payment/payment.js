document.addEventListener("DOMContentLoaded", () => {
  const paymentMethod = document.getElementById('paymentMethod');
  const emailSection = document.getElementById('emailSection');
  const bankSection = document.getElementById('bankSection');
  const paypalSection = document.getElementById('paypalSection');

  const payBtn = document.getElementById('payBtn');
  const bankConfirmBtn = document.getElementById('bankConfirmBtn');
  const paypalBtn = document.getElementById('paypalBtn');

  const nameInput = document.getElementById('name');
  const amountInput = document.getElementById('amount');
  const emailInput = document.getElementById('mainEmail');
  const emailSectionInput = document.getElementById('emailSectionInput');
  const bankStatus = document.getElementById('bankStatus');
  const returnBtn = document.getElementById("returnBtn");

  // 🔥 CHANGE THIS AFTER DEPLOYMENT
  const BACKEND_URL = "http://localhost:5000";

  if (returnBtn) {
    returnBtn.addEventListener("click", () => window.history.back());
  }

  const summaryDiv = document.createElement('div');
  summaryDiv.id = 'paymentSummary';
  summaryDiv.style.cssText = `
    background:#f0f0f0;
    padding:10px;
    margin-top:10px;
    border-radius:5px;
  `;
  bankSection.appendChild(summaryDiv);

  function hideAllSections() {
    emailSection.style.display = 'none';
    bankSection.style.display = 'none';
    paypalSection.style.display = 'none';
    bankStatus.textContent = "";
    summaryDiv.innerHTML = "";
  }

  hideAllSections();

  paymentMethod.addEventListener('change', () => {
    hideAllSections();
    if (paymentMethod.value === 'email') emailSection.style.display = 'block';
    else if (paymentMethod.value === 'bank') bankSection.style.display = 'block';
    else if (paymentMethod.value === 'paypal') paypalSection.style.display = 'block';
  });

  function validateFields(method) {
    if (!nameInput.value.trim()) return alert('Enter your name'), false;
    if (!amountInput.value || parseFloat(amountInput.value) <= 0) return alert('Enter valid amount'), false;
    if (!method) return alert('Select payment method'), false;

    if (method === 'email' && !emailSectionInput.value.trim()) return alert('Enter email'), false;
    if (method === 'email' && !emailInput.value.trim()) return alert('Enter main email'), false;

    return true;
  }

  function clearInputs() {
    nameInput.value = "";
    amountInput.value = "";
    emailInput.value = "";
    emailSectionInput.value = "";
    paymentMethod.value = "";
  }

  // ---------------- BANK ----------------
  bankConfirmBtn.addEventListener('click', async () => {
    if (!validateFields('bank')) return;

    try {
      const res = await fetch(`${BACKEND_URL}/payment/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nameInput.value,
          email: emailInput.value || emailSectionInput.value,
          amount: parseFloat(amountInput.value),
          method: "bank"
        })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Payment failed");

      const adminWhatsApp = "13864174481";

      const message = `Hello Admin, I have made a payment of $${amountInput.value}.
Name: ${nameInput.value}
Email: ${emailInput.value || emailSectionInput.value}`;

      window.open(
        "https://wa.me/" + adminWhatsApp + "?text=" + encodeURIComponent(message),
        "_blank"
      );

      bankStatus.textContent = "Payment sent. Await confirmation.";

      clearInputs();
      hideAllSections();

      alert("Payment submitted!");

    } catch (err) {
      alert(err.message);
    }
  });

  // ---------------- PAYPAL ----------------
  paypalBtn.addEventListener('click', () => {
    alert('Redirecting to PayPal...');
  });

  // ---------------- EMAIL ----------------
  payBtn.addEventListener('click', async () => {
    if (!validateFields('email')) return;

    try {
      const res = await fetch(`${BACKEND_URL}/payment/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nameInput.value,
          email: emailInput.value || emailSectionInput.value,
          amount: parseFloat(amountInput.value),
          method: "email"
        })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Payment failed");

      alert("Manual payment submitted!");

      clearInputs();
      hideAllSections();

    } catch (err) {
      alert(err.message);
    }
  });

});