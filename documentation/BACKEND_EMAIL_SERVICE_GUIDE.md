## Contact Email Service - Backend Implementation Guide

### Overview
Backend service endpoint that receives contact messages from the mobile app and sends formatted emails to the creator.

**Endpoint:** `POST /api/contact/send-email`
**Response Time:** < 2 seconds expected
**Authentication:** API Key in header

---

## Implementation Options

### Option 1: Node.js/Express (Recommended for Expo)

```javascript
// routes/contact.js
const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();

// Middleware: Verify API key
const verifyApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.CONTACT_API_KEY) {
    return res.status(401).json({ 
      success: false, 
      error: 'Unauthorized' 
    });
  }
  next();
};

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email service
  auth: {
    user: process.env.EMAIL_USER,      // jpdevland@gmail.com
    pass: process.env.EMAIL_PASSWORD   // App-specific password
  }
});

// Email template function
const createEmailTemplate = (data) => {
  const typeEmojis = {
    'bug_report': '🐛',
    'feature_request': '✨',
    'general_feedback': '💬',
    'other': '❓'
  };
  
  const typeLabels = {
    'bug_report': 'Bug Report',
    'feature_request': 'Feature Request',
    'general_feedback': 'General Feedback',
    'other': 'Other'
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            border: 1px solid #ddd;
            border-radius: 8px;
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            padding: 20px;
          }
          .field {
            margin: 20px 0;
            padding: 15px;
            background: #f9f9f9;
            border-left: 4px solid #2563eb;
            border-radius: 4px;
          }
          .label {
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 5px;
            font-size: 12px;
            text-transform: uppercase;
          }
          .value {
            color: #333;
            word-wrap: break-word;
          }
          .meta {
            background: #f0f0f0;
            padding: 15px;
            margin-top: 20px;
            border-radius: 5px;
            font-size: 12px;
            color: #666;
          }
          .meta-item {
            margin: 5px 0;
          }
          .footer {
            background: #f0f0f0;
            padding: 15px 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📧 New Message from BudgetZen</h1>
          </div>
          
          <div class="content">
            <div class="field">
              <div class="label">From</div>
              <div class="value">${data.userEmail}</div>
            </div>
            
            <div class="field">
              <div class="label">Type</div>
              <div class="value">${typeEmojis[data.messageType]} ${typeLabels[data.messageType]}</div>
            </div>
            
            <div class="field">
              <div class="label">Subject</div>
              <div class="value">${escapeHtml(data.subject)}</div>
            </div>
            
            <div class="field">
              <div class="label">Message</div>
              <div class="value">${escapeHtml(data.message).replace(/\n/g, '<br>')}</div>
            </div>
            
            <div class="meta">
              <div class="meta-item"><strong>Platform:</strong> ${data.platform}</div>
              <div class="meta-item"><strong>App Version:</strong> ${data.appVersion}</div>
              <div class="meta-item"><strong>Sent:</strong> ${new Date(data.timestamp).toLocaleString()}</div>
              <div class="meta-item"><strong>Time:</strong> ${new Date().toLocaleString()}</div>
            </div>
          </div>
          
          <div class="footer">
            <p>This is an automated message from BudgetZen App</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

// Helper: Escape HTML
const escapeHtml = (text) => {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
};

// POST /api/contact/send-email
router.post('/send-email', verifyApiKey, async (req, res) => {
  try {
    // ===== VALIDATE REQUEST =====
    const { userEmail, subject, message, messageType, platform, appVersion, timestamp } = req.body;

    // Required fields
    if (!userEmail || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userEmail, subject, message'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // ===== PREPARE EMAIL =====
    const emailTemplate = createEmailTemplate({
      userEmail,
      subject,
      message,
      messageType: messageType || 'other',
      platform: platform || 'unknown',
      appVersion: appVersion || 'unknown',
      timestamp: timestamp || new Date().toISOString()
    });

    // ===== SEND EMAIL =====
    console.log(`[Contact] Sending email from: ${userEmail}`);
    console.log(`[Contact] Subject: ${subject}`);

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: 'jpdevland@gmail.com', // Creator's email
      subject: `[${messageType}] ${subject}`,
      html: emailTemplate,
      replyTo: userEmail,
      headers: {
        'X-Priority': messageType === 'bug_report' ? '1' : '3', // High priority for bugs
        'X-MSMail-Priority': messageType === 'bug_report' ? 'High' : 'Normal'
      }
    });

    console.log(`[Contact] Email sent successfully to jpdevland@gmail.com`);

    // ===== OPTIONAL: SEND CONFIRMATION TO USER =====
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: 'We received your message - BudgetZen',
        html: `
          <p>Hi,</p>
          <p>Thank you for contacting us! We received your message:</p>
          <p><strong>"${escapeHtml(subject)}"</strong></p>
          <p>We read every message and will respond within 24 hours.</p>
          <p>Best regards,<br>BudgetZen Team</p>
        `
      });
      console.log(`[Contact] Confirmation email sent to: ${userEmail}`);
    } catch (error) {
      console.warn(`[Contact] Failed to send confirmation email:`, error.message);
      // Don't fail the whole request if confirmation fails
    }

    // ===== RESPONSE =====
    res.json({
      success: true,
      message: 'Email sent successfully'
    });

  } catch (error) {
    console.error('[Contact] Error sending email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send email. Please try again later.'
    });
  }
});

module.exports = router;
```

**Installation:**
```bash
npm install express nodemailer
```

**Environment Variables:**
```bash
CONTACT_API_KEY=your-secret-api-key
EMAIL_USER=jpdevland@gmail.com
EMAIL_PASSWORD=your-app-specific-password  # For Gmail, use App Password
```

---

### Option 2: Firebase Cloud Functions

```javascript
// functions/contactEmail/index.js
const functions = require('firebase-functions');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: functions.config().email.user,
    pass: functions.config().email.password
  }
});

exports.sendContactEmail = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    // Verify API key
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== functions.config().contact.api_key) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { userEmail, subject, message, messageType, platform, appVersion, timestamp } = req.body;

    // Validation...
    // Email sending logic...
    // (Same as Node.js option above)

    res.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
```

**Deploy:**
```bash
firebase deploy --only functions
```

---

### Option 3: Supabase Edge Functions

```typescript
// supabase/functions/contact-email/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify API key
    const apiKey = req.headers.get('X-API-Key');
    if (apiKey !== Deno.env.get('CONTACT_API_KEY')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const { userEmail, subject, message, messageType, platform, appVersion, timestamp } = await req.json();

    // Send email using SMTP...
    // (Similar logic to Node.js)

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
```

**Deploy:**
```bash
supabase functions deploy contact-email
```

---

## Gmail Setup (Most Common)

### 1. Enable 2-Factor Authentication
- Go to Google Account settings
- Enable 2-Step Verification

### 2. Create App Password
- Go to Google Account → Security
- Select "Mail" and "Windows Computer"
- Google generates 16-character password
- Use this in `EMAIL_PASSWORD` env var

### 3. Allow Less Secure Apps (Alternative)
- Not recommended - use App Password instead
- Go to myaccount.google.com/security
- Enable "Less secure app access"

---

## Email Service Alternatives

### SendGrid
```javascript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

await sgMail.send({
  to: 'jpdevland@gmail.com',
  from: 'noreply@budgetzen.com',
  subject: subject,
  html: emailTemplate,
  replyTo: userEmail
});
```

### Mailgun
```javascript
const mailgun = require('mailgun.js');
const FormData = require('form-data');

const mg = mailgun.client({ username: 'api', key: process.env.MAILGUN_API_KEY });

await mg.messages.create('budgetzen.com', {
  from: 'noreply@budgetzen.com',
  to: 'jpdevland@gmail.com',
  subject: subject,
  html: emailTemplate,
  'h:Reply-To': userEmail
});
```

### AWS SES
```javascript
const AWS = require('aws-sdk');
const ses = new AWS.SES();

await ses.sendEmail({
  Source: 'noreply@budgetzen.com',
  Destination: { ToAddresses: ['jpdevland@gmail.com'] },
  Message: {
    Subject: { Data: subject },
    Body: { Html: { Data: emailTemplate } }
  }
}).promise();
```

---

## Request/Response Examples

### Success Request
```bash
curl -X POST https://api.budgetzen.com/api/contact/send-email \
  -H "Content-Type: application/json" \
  -H "X-API-Key: secret-key-here" \
  -d '{
    "userEmail": "user@example.com",
    "subject": "App crashes on budget edit",
    "message": "When I try to edit a budget...",
    "messageType": "bug_report",
    "platform": "android",
    "appVersion": "1.0.0",
    "timestamp": "2025-12-20T10:30:00Z"
  }'
```

### Success Response
```json
{
  "success": true,
  "message": "Email sent successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Invalid email format"
}
```

---

## Rate Limiting

Protect against spam:

```javascript
const rateLimit = require('express-rate-limit');

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per IP
  message: 'Too many messages. Please try again later.'
});

router.post('/send-email', contactLimiter, verifyApiKey, async (req, res) => {
  // ...
});
```

---

## Logging & Monitoring

### 1. Log All Requests
```javascript
console.log(`[Contact] Email from: ${userEmail}`);
console.log(`[Contact] Message type: ${messageType}`);
console.log(`[Contact] Platform: ${platform}`);
```

### 2. Monitor Email Delivery
```javascript
transporter.verify((error, success) => {
  if (error) {
    console.error('[Contact] Email service error:', error);
  } else {
    console.log('[Contact] Email service ready');
  }
});
```

### 3. Setup Alerts
- Alert on 5+ consecutive failures
- Alert on unusual request patterns
- Daily summary of messages received

---

## Testing

### Unit Tests
```javascript
describe('Contact Email Service', () => {
  it('should validate email format', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(emailRegex.test('valid@example.com')).toBe(true);
    expect(emailRegex.test('invalid@')).toBe(false);
  });

  it('should verify API key', async () => {
    const response = await sendRequest('/api/contact/send-email', {
      headers: { 'X-API-Key': 'wrong-key' }
    });
    expect(response.status).toBe(401);
  });
});
```

### Manual Testing
```bash
# Test with valid request
curl -X POST http://localhost:3000/api/contact/send-email \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-key" \
  -d '{"userEmail":"test@example.com","subject":"Test","message":"This is a test"}'

# Test with invalid email
curl -X POST http://localhost:3000/api/contact/send-email \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-key" \
  -d '{"userEmail":"invalid","subject":"Test","message":"Test"}'
```

---

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Email service (Gmail/SendGrid/etc) setup
- [ ] API key generated and secured
- [ ] Rate limiting configured
- [ ] Error handling in place
- [ ] Logging enabled
- [ ] CORS headers correct
- [ ] Test email sent successfully
- [ ] Response times under 2 seconds
- [ ] Load testing (simulate 100+ concurrent requests)
- [ ] Monitoring/alerts setup
- [ ] Backup email service (if critical)

---

## Troubleshooting

### Email Not Sending
1. Check API key is correct
2. Check email credentials
3. Verify SMTP settings
4. Check email is not marked as spam
5. Review email template for issues

### Slow Response Times
1. Use connection pooling
2. Move email sending to background job
3. Cache transporter instance
4. Check network latency

### High Failure Rate
1. Check email service status
2. Verify credential validity
3. Review rate limiting
4. Check firewall/network issues

---

## Production Setup Example

**Complete Node.js Backend** (Minimal)

```javascript
const express = require('express');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
app.use(express.json());

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

app.post('/api/contact/send-email', async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== process.env.CONTACT_API_KEY) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { userEmail, subject, message, messageType, platform, appVersion, timestamp } = req.body;

    if (!userEmail || !subject || !message) {
      return res.status(400).json({ success: false, error: 'Missing fields' });
    }

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: 'jpdevland@gmail.com',
      subject: `[${messageType}] ${subject}`,
      html: `<p>${message}</p><p>From: ${userEmail}</p>`,
      replyTo: userEmail
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(process.env.PORT || 3000);
```

**Environment Variables (.env)**
```
EMAIL_USER=jpdevland@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
CONTACT_API_KEY=your-secret-api-key
PORT=3000
```

**Run:**
```bash
npm install express nodemailer dotenv
node index.js
```

---

**Status: ✅ READY FOR IMPLEMENTATION**

Choose an option above and implement the backend service. Then test with the frontend using your backend URL.
