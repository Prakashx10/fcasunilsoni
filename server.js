import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares to parse request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security Headers Middleware (prevents Clickjacking, MIME sniffing, and XSS Auditor bypasses)
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Route to serve data.json dynamically
app.get('/data/data.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'data', 'data.json'));
});

// Utility to escape HTML entities (prevents HTML/script injection inside email templates)
function escapeHTML(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[&<>'\"/]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
      '/': '&#x2F;'
    }[tag] || tag)
  );
}

// POST route to handle contact form submission
app.post('/api/contact', async (req, res) => {
  try {
    const { fullName, emailAddr, phoneNum, serviceType, enquiryMessage } = req.body;

    // 1. Basic presence check
    if (!fullName || !emailAddr || !phoneNum || !serviceType || !enquiryMessage) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields (Name, Email, Phone, Service, Message) are required.' 
      });
    }

    // 2. Format Sanitization & Validation (Backend validation)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailAddr.trim())) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a valid email address.' 
      });
    }

    const cleanPhone = phoneNum.replace(/\D/g, '');
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a valid 10-to-15 digit mobile number.' 
      });
    }

    // 3. Escape HTML characters to prevent XSS/HTML injection inside the email template
    const safeName = escapeHTML(fullName.trim());
    const safeEmail = escapeHTML(emailAddr.trim());
    const safePhone = escapeHTML(phoneNum.trim());
    const safeMessage = escapeHTML(enquiryMessage.trim());

    // Map service ID to readable service name
    const serviceMap = {
      consultation: 'Consultation',
      taxation: 'Taxation Services (GST & ITR)',
      audit: 'Audit & Assurance',
      advisory: 'Business Advisory & Loan Reports',
      incorporation: 'Company / LLP Registration',
      accounting: 'Bookkeeping & Accounting',
      general: 'General Financial Query'
    };
    const serviceName = serviceMap[serviceType] || serviceType;

    // 4. Resolve SMTP Mailer Transporter (Strict: No Ethereal fallback)
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      console.error('❌ Nodemailer: SMTP configuration is missing in .env.');
      return res.status(500).json({
        success: false,
        message: 'Mailing service is currently unconfigured. Please try again later.'
      });
    }

    const transporter = nodemailer.createTransport({
      host: host,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user, pass }
    });

    // 5. Compose HTML Email template matching Slate/Gold design (Client Confirmation Receipt)
    const htmlEmailTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Enquiry Received - SUNIL KUMAR SONI & CO.</title>
        <style>
          body {
            background-color: #060913;
            color: #f3f4f6;
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 30px 10px;
          }
          .email-card {
            background-color: #0b0f19;
            border: 1px solid rgba(212, 175, 55, 0.25);
            border-radius: 8px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            max-width: 600px;
            margin: 0 auto;
            overflow: hidden;
          }
          .email-header {
            background: linear-gradient(135deg, #0f172a, #0b0f19);
            border-bottom: 2px solid #d4af37;
            padding: 25px 20px;
            text-align: center;
          }
          .email-header h2 {
            color: #d4af37;
            font-size: 22px;
            font-weight: 700;
            letter-spacing: 0.5px;
            margin: 0 0 5px 0;
            text-transform: uppercase;
          }
          .email-header span {
            color: #9ca3af;
            font-size: 10px;
            font-weight: 500;
            letter-spacing: 3px;
          }
          .email-body {
            padding: 30px 25px;
          }
          .callout-box {
            background-color: rgba(212, 175, 55, 0.05);
            border-left: 4px solid #d4af37;
            border-radius: 4px;
            color: #ffd700;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 25px;
            padding: 12px 18px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .details-table {
            border-collapse: collapse;
            width: 100%;
            margin-bottom: 25px;
          }
          .details-table th, .details-table td {
            font-size: 14px;
            padding: 12px 15px;
            text-align: left;
          }
          .details-table th {
            background-color: rgba(255,255,255,0.02);
            border-bottom: 1px solid rgba(255,255,255,0.06);
            color: #9ca3af;
            font-weight: 600;
            width: 35%;
          }
          .details-table td {
            border-bottom: 1px solid rgba(255,255,255,0.06);
            color: #f3f4f6;
          }
          .message-title {
            color: #d4af37;
            font-size: 14px;
            font-weight: 600;
            margin: 0 0 10px 0;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .message-box {
            background-color: rgba(255, 255, 255, 0.015);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 6px;
            color: #d1d5db;
            font-size: 14px;
            line-height: 1.6;
            padding: 20px;
            white-space: pre-line;
          }
          .email-footer {
            background-color: #04060d;
            border-top: 1px solid rgba(255,255,255,0.04);
            padding: 20px;
            text-align: center;
          }
          .email-footer p {
            color: #6b7280;
            font-size: 11px;
            line-height: 1.5;
            margin: 0 0 10px 0;
          }
          .disclaimer {
            border-left: 2px solid #d4af37;
            display: inline-block;
            text-align: left;
            padding-left: 10px;
          }
        </style>
      </head>
      <body>
        <div class="email-card">
          <div class="email-header">
            <h2>SUNIL KUMAR SONI & CO.</h2>
            <span>CHARTERED ACCOUNTANTS</span>
          </div>
          <div class="email-body">
            <div class="callout-box">
              ✔️ Enquiry Received Successfully
            </div>
            
            <p style="font-size: 14px; color: #e5e7eb; line-height: 1.6; margin: 0 0 25px 0;">
              Dear ${safeName},<br><br>
              Thank you for contacting <strong>SUNIL KUMAR SONI & CO.</strong> We have successfully received your enquiry regarding <strong>${serviceName}</strong>. Our team will review your requirements and get in touch with you shortly.
            </p>
            
            <h4 class="message-title">Summary of Details Submitted:</h4>
            <table class="details-table">
              <tr>
                <th>Your Name</th>
                <td>${safeName}</td>
              </tr>
              <tr>
                <th>Email Address</th>
                <td>${safeEmail}</td>
              </tr>
              <tr>
                <th>Mobile Number</th>
                <td>${safePhone}</td>
              </tr>
              <tr>
                <th>Requested Service</th>
                <td>${serviceName}</td>
              </tr>
            </table>
            
            <h4 class="message-title">Your Message:</h4>
            <div class="message-box">${safeMessage}</div>
          </div>
          <div class="email-footer">
            <p class="disclaimer">
              <strong>Notice:</strong> This acknowledgement form matches regulatory mandates. 
              If you did not submit this enquiry, please disregard this email.
            </p>
            <p>&copy; ${new Date().getFullYear()} SUNIL KUMAR SONI & CO. Chartered Accountants. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // 6. Compose Mail Options (TO client, CC firm, BCC tracker)
    const mailOptions = {
      from: process.env.SMTP_FROM || '"SUNIL KUMAR SONI & CO. Contact Desk" <fcasunilsoni@gmail.com>',
      to: safeEmail, // To the enquiry sender
      cc: process.env.MAIL_CC || 'fcasunilsoni@gmail.com', // CC'd to firm
      bcc: process.env.MAIL_BCC || 'deepaksoni.nitrr@gmail.com', // BCC'd to tracker
      subject: `Enquiry Received - SUNIL KUMAR SONI & CO.`,
      html: htmlEmailTemplate
    };

    // 7. Send Mail
    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️  Nodemailer: Confirmation email sent successfully to ${safeEmail}. MessageID: ${info.messageId}`);

    // 8. Return response
    return res.status(200).json({
      success: true,
      message: 'Enquiry submitted successfully! A confirmation receipt has been sent to your email.'
    });

  } catch (error) {
    console.error('❌ Error handling contact form submission API:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error while processing your enquiry. Please try again later.' 
    });
  }
});

// Wildcard fallback route to serve index.html for frontend routing
app.get('*all', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 SUNIL KUMAR SONI & CO. Server running on port ${PORT}`);
  console.log(`   Local URL: http://localhost:3000`);
  console.log(`==================================================`);
});
