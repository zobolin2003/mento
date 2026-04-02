import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  // 读取环境变量（和你原来的 server.ts 完全一致，不用改）
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || smtpUser;

  // 校验环境变量
  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Supabase configuration missing on server' });
  }
  if (!smtpHost || !smtpUser || !smtpPass) {
    return res.status(500).json({ error: 'SMTP configuration missing on server' });
  }

  // 初始化 Supabase 管理员客户端
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // 初始化 Nodemailer 邮件发送器
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  try {
    // 1. 生成 OTP（和你原来的逻辑完全一致）
    let { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

    // 如果用户不存在，自动创建用户
    if (error?.message.includes("User not found")) {
      const signupRes = await supabaseAdmin.auth.admin.generateLink({
        type: "signup",
        email,
        password: Math.random().toString(36).slice(-8) + "A1!",
      });
      data = signupRes.data;
      error = signupRes.error;
    }
    if (error) throw error;

    const otp = data?.properties?.email_otp;
    if (!otp) {
      throw new Error("Failed to generate OTP from Supabase");
    }

    // 2. 发送邮件（和你原来的模板完全一致）
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

    // 3. 返回成功 JSON（前端正常解析）
    res.json({ success: true });
  } catch (err) {
    console.error("OTP Generation/Sending Error:", err);
    res.status(500).json({ error: err.message || "Failed to send OTP" });
  }
}