import express from "express";
import bcrypt from "bcrypt";
import sgMail from "@sendgrid/mail";

const app = express();
app.use(express.json());

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Temporary in-memory storage for admins
const admins = [];
const resetTokens = {}; // key: token, value: email

// Request password reset
app.post("/admin/forgot-password", async (req, res) => {
  const { email } = req.body;
  const admin = admins.find(a => a.email === email);
  if (!admin) return res.status(400).json({ success: false, error: "Admin not found" });

  // Generate a temporary token
  const token = Math.random().toString(36).substring(2, 12);
  resetTokens[token] = email;

  // Email the token
  const resetLink = `/admin/reset-password?token=${token}`;
  const msg = {
    to: email,
    from: "no-reply@yourdomain.com",
    subject: "Admin Password Reset",
    text: `Click this link to reset your password: ${resetLink}`,
    html: `<p>Click this link to reset your password:</p><a href="${resetLink}">${resetLink}</a>`
  };

  try {
    await sgMail.send(msg);
    res.json({ success: true, message: "Reset link sent to your email" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to send email" });
  }
});

// Reset password endpoint
app.post("/admin/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  const email = resetTokens[token];
  if (!email) return res.status(400).json({ success: false, error: "Invalid or expired token" });

  const admin = admins.find(a => a.email === email);
  admin.password = await bcrypt.hash(newPassword, 10);

  // Remove token after use
  delete resetTokens[token];

  res.json({ success: true, message: "Password reset successfully" });
});
