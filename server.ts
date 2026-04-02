import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.post("/api/send-otp", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
    
    // SMTP Config
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || "465", 10);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || smtpUser;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: "Supabase configuration missing on server" });
    }
    if (!smtpHost || !smtpUser || !smtpPass) {
      return res.status(500).json({ error: "SMTP configuration missing on server" });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    try {
      // 1. Generate OTP via Supabase Admin
      let { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email,
      });

      if (error) {
        // If user doesn't exist and magiclink fails, try signup to auto-create user
        if (error.message.includes("User not found")) {
          const signupRes = await supabaseAdmin.auth.admin.generateLink({
            type: "signup",
            email,
            password: Math.random().toString(36).slice(-8) + "A1!", // Required for signup link
          });
          data = signupRes.data;
          error = signupRes.error;
        }
        if (error) throw error;
      }

      const otp = data?.properties?.email_otp;
      if (!otp) {
        throw new Error("Failed to generate OTP from Supabase");
      }

      // 2. Send via Nodemailer
      await transporter.sendMail({
        from: smtpFrom,
        to: email,
        subject: "Your Login Code",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #333;">Your Login Code</h2>
            <p style="color: #555; font-size: 16px;">Here is your 6-digit verification code:</p>
            <div style="background-color: #f4f4f5; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0;">
              <h1 style="font-size: 40px; letter-spacing: 8px; color: #18181b; margin: 0;">${otp}</h1>
            </div>
            <p style="color: #555; font-size: 16px;">Please enter this code on the login page to sign in.</p>
            <p style="color: #999; font-size: 12px; margin-top: 40px;">This code will expire in 10 minutes.</p>
          </div>
        `,
      });

      res.json({ success: true });
    } catch (err: any) {
      console.error("OTP Generation/Sending Error:", err);
      res.status(500).json({ error: err.message || "Failed to send OTP" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
