import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASS,
  },
});

export async function sendForgotPasswordEmail(
  toEmail: string,
  userName: string,
  resetToken: string
) {
  const resetUrl = `${process.env.APP_URL}/reset-password?token=${resetToken}`;

  const userDisplayName = userName || "Memora User";
  const appName = "Memora";
  const primaryColor = "#6D28D9";
  const secondaryColor = "#8B5CF6";

  const preheaderText = `Reset your ${appName} password and get back to your bookmarks!`;

  const mailOptions = {
    from: `"${appName} Support" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: `🔐 Reset Your ${appName} Password`,
    text: `Hi ${userDisplayName},

We received a request to reset your ${appName} account password.

To reset your password, please click the link below or copy and paste it into your browser:
${resetUrl}

This link will expire in 1 hour.

If you did not request a password reset, please ignore this email or contact support if you have concerns. Your password will remain unchanged.

Thanks for using ${appName}!

Best regards,
The ${appName} Team`,

    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>Reset Your ${appName} Password</title>
  <style>
   
    body {
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.07), 0 20px 20px -10px rgba(0, 0, 0, 0.04);
    }
    .header {
      background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0 0 10px 0;
      font-size: 28px;
      font-weight: 600;
      letter-spacing: -0.5px;
    }
    .header .logo {
      font-size: 36px;
      margin-bottom: 15px;
      display: inline-block;
      background-color: rgba(255, 255, 255, 0.2);
      color:white;
      width: 60px;
      height: 60px;
      line-height: 60px;
      border-radius: 12px;
    }
    .header p {
      margin: 0;
      font-size: 16px;
      color: rgba(255, 255, 255, 0.9);
    }
    .content {
      padding: 30px 30px 40px;
      color: #374151;
      line-height: 1.6;
    }
    .content h2 {
      color: #1f2937;
      font-size: 22px;
      font-weight: 600;
      margin-top: 0;
      margin-bottom: 15px;
    }
    .content p {
      font-size: 16px;
      margin-bottom: 20px;
    }
    .button-cta {
      display: block;
      width: fit-content;
      margin: 30px auto;
      padding: 15px 30px;
      background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%);
      color: white !important;
      text-decoration: none;
      font-size: 17px;
      font-weight: 600;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
      transition: transform 0.2s ease;
    }
    .button-cta:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(0,0,0,0.15);
    }
    .link-section {
      margin-top: 30px;
      padding: 20px;
      background-color: #f3f4f6;
      border-radius: 8px;
      text-align: center;
    }
    .link-section p {
      font-size: 14px;
      color: #4b5563;
      margin-bottom: 10px;
    }
    .reset-url {
      word-break: break-all;
      font-family: 'Courier New', Courier, monospace;
      font-size: 13px;
      color: ${primaryColor};
      background-color: #e5e7eb;
      padding: 8px 12px;
      border-radius: 4px;
      display: inline-block;
    }
    .security-info {
      margin-top: 30px;
      padding: 15px;
      background-color: #FEFCE8;
      border-left: 4px solid #FACC15;
      border-radius: 0 8px 8px 0;
      font-size: 14px;
      color: #713F12;
    }
    .security-info strong {
      color: #713F12;
    }
    .footer {
      padding: 30px;
      text-align: center;
      font-size: 13px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
    }
    .footer .app-name {
      color: ${primaryColor};
      font-weight: 600;
    }
    .footer a {
      color: ${primaryColor};
      text-decoration: none;
    }
    .footer a:hover {
      text-decoration: underline;
    }
    .preheader {
      display: none !important;
      visibility: hidden;
      opacity: 0;
      color: transparent;
      height: 0;
      width: 0;
      mso-hide:all;
    }

   
    @media screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        margin: 0 auto !important;
        border-radius: 0 !important;
        box-shadow: none !important;
      }
      .header, .content, .footer {
        padding-left: 20px !important;
        padding-right: 20px !important;
      }
      .header h1 {
        font-size: 24px !important;
      }
      .content h2 {
        font-size: 20px !important;
      }
      .content p {
        font-size: 15px !important;
      }
      .button-cta {
        padding: 14px 25px !important;
        font-size: 16px !important;
      }
    }
  </style>
</head>
<body>
  <!-- Preheader Text -->
  <span class="preheader">${preheaderText}</span>

  <div class="email-container">
    <div class="header">
      <div class="logo">M</div>
      <h1>Reset Your Password</h1>
      <p>Securely access your ${appName} account</p>
    </div>

    <div class="content">
      <h2>Hi ${userDisplayName},</h2>
      <p>We received a request to reset the password for your ${appName} account. No problem!</p>
      <p>To create a new password, simply click the button below. This link is valid for <strong>1 hour</strong>.</p>

      <table_removed_for_modern_approach_unless_needed_for_legacy_clients width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td align="center">
            <a href="${resetUrl}" class="button-cta" target="_blank">
              🔑 Reset My Password
            </a>
          </td>
        </tr>
      </table_removed_for_modern_approach_unless_needed_for_legacy_clients>
      
      <div class="link-section">
        <p>If the button above doesn't work, copy and paste this link into your web browser:</p>
        <p><span class="reset-url">${resetUrl}</span></p>
      </div>

      <div class="security-info">
        <p style="margin:0;">
          🛡️ <strong>Didn't request this change?</strong> If you didn't ask to reset your password, you can safely ignore this email. Your account security is important to us, and your password will remain unchanged.
        </p>
      </div>
      
      <p style="margin-top: 30px; text-align:center; font-size: 15px;">
        Get back to organizing your digital world with ${appName}!
      </p>
    </div>

    <div class="footer">
      <p>
        Happy Bookmarking!<br>
        <strong>The <span class="app-name">${appName}</span> Team</strong>
      </p>
      <p style="margin-top: 15px; font-size: 12px; color: #9ca3af;">
        This is an automated message. Please do not reply to this email.
        If you need help, visit our <a href="${
          process.env.APP_URL
        }/support">Support Center</a> or contact us through the app.
      </p>
      <p style="margin-top: 15px; font-size: 12px; color: #9ca3af;">
        © ${new Date().getFullYear()} ${appName}. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Forgot password email sent successfully to ${toEmail}`);
  } catch (error) {
    console.error(`❌ Failed to send email to ${toEmail}:`, error);
    throw new Error(
      `Failed to send password reset email. Please try again later.`
    );
  }
}

export async function sendAccessCode(
  toEmail: string,
  userName: string,
  accessCode: string
) {
  const userDisplayName = userName || "Memora User";
  const appName = "Memora";
  const appUrl = process.env.APP_URL;

  const mailOptions = {
    from: `"${appName} Support" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: `🔐 Your ${appName} Access Code`,
    text: `Hi ${userDisplayName},

Your ${appName} access code: ${accessCode}

It will expire in 10 minutes.

If you did not request this, please ignore the email.

– The ${appName} Team`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body {
      font-family: Arial, sans-serif;
      background: #f9fafb;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 480px;
      margin: auto;
      background: #ffffff;
      padding: 24px;
      border-radius: 8px;
      font-size: 16px;
      color: #111827;
      line-height: 1.5;
    }
    .access-code {
      font-family: monospace;
      font-size: 24px;
      background: #f3f4f6;
      padding: 12px 16px;
      text-align: center;
      border-radius: 6px;
      margin: 20px 0;
      color: #4f46e5;
    }
    .footer {
      margin-top: 30px;
      font-size: 12px;
      color: #6b7280;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <p>Hi ${userDisplayName},</p>
    <p>Here is your access code for logging into <strong>${appName}</strong>:</p>

    <div class="access-code">${accessCode}</div>

    <p>This code will expire in <strong>10 minutes</strong>.</p>

    <p>If you didn’t request this code, you can ignore this email.</p>

    <p>– The ${appName} Team</p>

    <div class="footer">
      <p>Need help? Visit <a href="${appUrl}/support">${appUrl}/support</a></p>
      <p>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Access code email sent to ${toEmail}`);
  } catch (error) {
    console.error(`❌ Failed to send email to ${toEmail}:`, error);
    throw new Error(
      "Failed to send access code email. Please try again later."
    );
  }
}
