import express from "express";
import cors from "cors";
import sgMail from "@sendgrid/mail";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());

/* ================= SUPABASE INIT ================= */
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing Supabase ENV variables");
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* ================= SENDGRID INIT ================= */
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

/* ================= HEALTH CHECK ================= */
app.get("/", (req, res) => {
  res.json({ success: true, message: "Backend running 🚀" });
});

/* ================= AUTH ================= */
function verifyAdmin(req, res, next) {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  try {
    req.admin = jwt.verify(auth.split(" ")[1], process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ success: false, error: "Invalid token" });
  }
}

/* ================= ADMIN REGISTER ================= */
app.post("/admin/register", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: "Missing fields" });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from("admins")
      .insert([{ email, password: hashed }])
      .select();

    if (error) throw error;

    res.json({ success: true, data });

  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ================= ADMIN LOGIN ================= */
app.post("/admin/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const { data: admin, error } = await supabase
      .from("admins")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !admin) {
      return res.status(401).json({ success: false, error: "Invalid login" });
    }

    const match = await bcrypt.compare(password, admin.password);

    if (!match) {
      return res.status(401).json({ success: false, error: "Invalid login" });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({ success: true, token });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ================= PAYMENT SUBMIT ================= */
app.post("/payment/submit", async (req, res) => {
  const { name, email, amount, method } = req.body;

  if (!name || !email || !amount || !method) {
    return res.status(400).json({
      success: false,
      error: "Missing fields"
    });
  }

  try {
    const { error } = await supabase.from("payments").insert([
      {
        name,
        email,
        amount,
        method,
        status: "pending"
      }
    ]);

    if (error) throw error;

    res.json({ success: true });

  } catch (err) {
    console.error("Payment error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ================= TRACKING (FIXED) ================= */
app.get("/tracking", async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({
      success: false,
      error: "Email is required"
    });
  }

  try {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("email", email)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ================= GET PENDING PAYMENTS ================= */
app.get("/payment/pending", verifyAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ================= VERIFY PAYMENT ================= */
app.post("/payment/verify", verifyAdmin, async (req, res) => {
  const { id } = req.body;

  try {
    const { data: payment, error } = await supabase
      .from("payments")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !payment) {
      return res.status(404).json({
        success: false,
        error: "Payment not found"
      });
    }

    const trackingId = "FL-" + crypto.randomBytes(4).toString("hex");

    const { error: updateError } = await supabase
      .from("payments")
      .update({
        status: "verified",
        tracking_id: trackingId
      })
      .eq("id", id);

    if (updateError) {
      return res.status(500).json({
        success: false,
        error: updateError.message
      });
    }

    // EMAIL (SAFE)
    if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM) {
      try {
        await sgMail.send({
          to: payment.email,
          from: process.env.SENDGRID_FROM,
          subject: "Shipment Verified ✔",
          html: `
            <h2>National Airway Delivery</h2>
            <p>Hello ${payment.name},</p>
            <p>Your payment has been verified.</p>
            <p><b>Tracking ID:</b> ${trackingId}</p>
          `
        });
      } catch (e) {
        console.error("Email failed:", e.message);
      }
    }

    res.json({
      success: true,
      trackingId
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ================= DELETE PAYMENT ================= */
app.post("/payment/delete", verifyAdmin, async (req, res) => {
  const { id } = req.body;

  try {
    const { error } = await supabase
      .from("payments")
      .delete()
      .eq("id", id);

    if (error) throw error;

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


app.post("/payment/request", async (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({
      success: false,
      error: "Name and email required"
    });
  }

  try {
    const { error } = await supabase.from("payment_requests").insert([
      {
        name,
        email,
        status: "requesting_payment"
      }
    ]);

    if (error) throw error;

    res.json({
      success: true,
      message: "Payment request sent"
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

app.post("/request", async (req, res) => {
  const { name, email, phone, service, weight, destination, note } = req.body;

  if (!name || !email || !phone || !service) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields"
    });
  }

  try {
    const { data, error } = await supabase.from("requests").insert([
      {
        name,
        email,
        phone,
        service,
        weight,
        destination,
        note,
        status: "pending"
      }
    ]);

    if (error) throw error;

    res.json({
      success: true,
      message: "Request submitted successfully"
    });

  } catch (err) {
    console.error("Request error:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});


// ================= GET ALL REQUESTS =================
app.get("/requests", verifyAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


// ================= APPROVE REQUEST =================
app.post("/request/approve", verifyAdmin, async (req, res) => {
  const { id } = req.body;

  try {
    const { data: request, error } = await supabase
      .from("requests")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !request) {
      return res.status(404).json({
        success: false,
        error: "Request not found"
      });
    }

    const { error: updateError } = await supabase
      .from("requests")
      .update({ status: "approved" })
      .eq("id", id);

    if (updateError) throw updateError;

    // OPTIONAL EMAIL
    if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM) {
      try {
        await sgMail.send({
          to: request.email,
          from: process.env.SENDGRID_FROM,
          subject: "Payment Required - Shipment Approved",
          html: `
            <h2>National Airway Delivery</h2>
            <p>Hello ${request.name},</p>
            <p>Your shipment request has been approved.</p>
            <p>Please proceed with payment to continue processing.</p>
          `
        });
      } catch (e) {
        console.error("Email error:", e.message);
      }
    }

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


/* ================= START SERVER ================= */
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});