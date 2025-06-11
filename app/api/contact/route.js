import axios from 'axios';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_ADDRESS,
    pass: process.env.GMAIL_PASSKEY,
  },
});

// Email HTML template
const generateEmailTemplate = (name, email, userMessage) => `
  <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; background-color: #f4f4f4;">
    <div style="max-width: 600px; margin: auto; background-color: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);">
      <h2 style="color: #007BFF;">New Message Received</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong></p>
      <blockquote style="border-left: 4px solid #007BFF; padding-left: 10px;">${userMessage}</blockquote>
      <p style="font-size: 12px; color: #888;">Click reply to respond to the sender.</p>
    </div>
  </div>
`;

// Send email
async function sendEmail({ name, email, message }) {
  const mailOptions = {
    from: `"Portfolio" <${process.env.EMAIL_ADDRESS}>`,
    to: process.env.EMAIL_ADDRESS,
    subject: `New message from ${name}`,
    text: message,
    html: generateEmailTemplate(name, email, message),
    replyTo: email,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email error:', error);
    return false;
  }
}

// Send Telegram message
async function sendTelegramMessage(token, chat_id, message) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    const res = await axios.post(url, {
      chat_id,
      text: message,
    });
    return res.data.ok;
  } catch (error) {
    console.error('Telegram error:', error?.response?.data || error.message);
    return false;
  }
}

// Main POST handler
export async function POST(request) {
  try {
    const { name, email, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json({
        success: false,
        message: 'All fields (name, email, message) are required.',
      }, { status: 400 });
    }

    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramChatId = process.env.TELEGRAM_CHAT_ID;

    if (!telegramToken || !telegramChatId || !process.env.EMAIL_ADDRESS || !process.env.GMAIL_PASSKEY) {
      return NextResponse.json({
        success: false,
        message: 'Missing environment variables for email or Telegram.',
      }, { status: 500 });
    }

    const formattedMsg = `📩 *New Contact Message*\n\n👤 Name: ${name}\n📧 Email: ${email}\n📝 Message:\n${message}`;

    const telegramSuccess = await sendTelegramMessage(telegramToken, telegramChatId, formattedMsg);
    const emailSuccess = await sendEmail({ name, email, message });

    if (telegramSuccess && emailSuccess) {
      return NextResponse.json({ success: true, message: 'Message sent successfully!' }, { status: 200 });
    }

    return NextResponse.json({
      success: false,
      message: 'Failed to send message via email or Telegram.',
    }, { status: 500 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal Server Error',
    }, { status: 500 });
  }
}
