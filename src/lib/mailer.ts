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
  resetToken: string,
) {
  const resetUrl = `${process.env.APP_URL}/reset-password?token=${resetToken}`;
  // const resetUrl = `http://localhost:4200/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: `"Memora Support" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: "🔐 Reset Your Memora Password",
    text: `Hi ${userName || "there"},

We received a request to reset your Memora account password.

To reset your password, please click the link below or copy and paste it into your browser:
${resetUrl}

This link will expire in 1 hour.

If you did not request a password reset, please ignore this email and your password will remain unchanged.

Thanks for using Memora!

Best regards,
The Memora Team`,

    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="format-detection" content="telephone=no">
        <title>Reset Your Memora Password</title>
        <!--[if mso]>
        <noscript>
          <xml>
            <o:OfficeDocumentSettings>
              <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
          </xml>
        </noscript>
        <![endif]-->
      </head>
      <body style="margin: 0; padding: 0; background-color: #f7fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
        
        <!-- Preheader text (hidden but shows in email preview) -->
        <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">
          Reset your Memora password to regain access to all your bookmarks
        </div>
        
        <!-- Main Container -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f7fafc;">
          <tr>
            <td align="center" valign="top" style="padding: 10px;">
              
              <!-- Email Container -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 30px 20px; text-align: center;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td align="center">
                          <div style="background-color: rgba(255, 255, 255, 0.15); width: 60px; height: 60px; border-radius: 16px; margin: 0 auto 15px; display: inline-block; line-height: 60px; text-align: center;">
                            <span style="font-size: 28px; vertical-align: middle; color:white;">M</span>
                          </div>
                          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.5px; line-height: 1.2;">
                            Reset Your Password
                          </h1>
                          <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 15px; line-height: 1.4;">
                            Secure access to your Memora
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Main Content -->
                <tr>
                  <td style="padding: 30px 20px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      
                      <!-- Greeting -->
                      <tr>
                        <td style="text-align: center; padding-bottom: 25px;">
                          <h2 style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 0 0 8px 0; line-height: 1.3;">
                            Hello ${userName || "there"}! 👋
                          </h2>
                          <p style="color: #6b7280; font-size: 15px; margin: 0; line-height: 1.5;">
                            We received a request to reset your Memora password
                          </p>
                        </td>
                      </tr>
                      
                      <!-- Main Message -->
                      <tr>
                        <td style="padding-bottom: 25px;">
                          <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; border-left: 4px solid #4f46e5;">
                            <p style="color: #374151; font-size: 15px; margin: 0 0 12px 0; line-height: 1.6;">
                              Your bookmarks are important to us, and we want to make sure your account stays secure. 
                              Tap the button below to create a new password and regain access to all your saved links.
                            </p>
                            <p style="color: #6b7280; font-size: 13px; margin: 0; font-style: italic; line-height: 1.4;">
                              This reset was requested from your account settings.
                            </p>
                          </div>
                        </td>
                      </tr>
                      
                      <!-- CTA Button -->
                      <tr>
                        <td style="text-align: center; padding: 25px 0;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                            <tr>
                              <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); border-radius: 8px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);">
                                <a href="${resetUrl}" 
                                   style="display: block; color: white; text-decoration: none; 
                                          padding: 16px 28px; font-weight: 600; font-size: 16px; 
                                          border-radius: 8px; text-align: center; letter-spacing: 0.5px;
                                          min-width: 200px; box-sizing: border-box;">
                                  🔑 Reset My Password
                                </a>
                              </td>
                            </tr>
                          </table>
                          <p style="color: #9ca3af; font-size: 13px; margin: 12px 0 0 0; line-height: 1.4;">
                            This button will take you to a secure reset page
                          </p>
                        </td>
                      </tr>
                      
                      <!-- Alternative Link Section -->
                      <tr>
                        <td style="padding-bottom: 25px;">
                          <div style="background-color: #f9fafb; border: 2px dashed #d1d5db; border-radius: 8px; padding: 18px; text-align: center;">
                            <p style="color: #374151; font-size: 14px; margin: 0 0 10px 0; font-weight: 600; line-height: 1.4;">
                              🔗 Having trouble with the button?
                            </p>
                            <p style="color: #6b7280; font-size: 13px; margin: 0 0 12px 0; line-height: 1.4;">
                              Copy and paste this secure link into your browser:
                            </p>
                            <div style="background-color: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; font-family: 'Courier New', monospace; margin: 0 auto; max-width: 100%; overflow-wrap: break-word;">
                              <p style="word-break: break-all; color: #4f46e5; font-size: 12px; margin: 0; line-height: 1.4;">
                                ${resetUrl}
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                      
                      <!-- Security Features -->
                      <tr>
                        <td style="padding-bottom: 25px;">
                          <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 10px; padding: 18px; border: 1px solid #f59e0b;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                              <tr>
                                <td style="width: 30px; vertical-align: top; padding-top: 2px;">
                                  <span style="font-size: 18px;">🛡️</span>
                                </td>
                                <td style="vertical-align: top;">
                                  <p style="color: #92400e; font-size: 14px; margin: 0 0 8px 0; font-weight: 600; line-height: 1.4;">
                                    Security & Privacy Protected
                                  </p>
                                  <p style="color: #b45309; font-size: 13px; margin: 0; line-height: 1.5;">
                                    • This reset link expires in <strong>1 hour</strong> for your protection<br/>
                                    • Your bookmarks and data remain completely secure<br/>
                                    • If you didn't request this, simply ignore this email
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </div>
                        </td>
                      </tr>
                      
                      <!-- App Benefits Reminder -->
                      <tr>
                        <td style="text-align: center; padding-bottom: 20px;">
                          <p style="color: #6b7280; font-size: 15px; margin: 0 0 12px 0; line-height: 1.5;">
                            Once you're back in, you'll have access to:
                          </p>
                          <div style="text-align: left; display: inline-block; max-width: 280px;">
                            <p style="color: #4b5563; font-size: 13px; margin: 4px 0; line-height: 1.6;">
                              📌 All your saved bookmarks<br/>
                              🏷️ Organized collections and tags<br/>
                              🔍 Powerful search across your links<br/>
                              📱 Sync across all your devices
                            </p>
                          </div>
                        </td>
                      </tr>
                      
                    </table>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 25px 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="padding-bottom: 15px;">
                          <p style="color: #374151; font-size: 15px; margin: 0 0 6px 0; font-weight: 600; line-height: 1.4;">
                            Happy Bookmarking! 📚
                          </p>
                          <p style="color: #6b7280; font-size: 13px; margin: 0; line-height: 1.5;">
                            Best regards,<br/>
                            <strong style="color: #4f46e5;">The Memora Team</strong>
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="border-top: 1px solid #e5e7eb; padding-top: 15px;">
                          <p style="color: #9ca3af; font-size: 11px; margin: 0 0 6px 0; line-height: 1.4;">
                            This is an automated security email. Please do not reply.
                          </p>
                          <p style="color: #9ca3af; font-size: 11px; margin: 0; line-height: 1.4;">
                            Need help? Visit our support center or contact us through the app.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
              </table>
              
            </td>
          </tr>
          
          <!-- Bottom Spacing & Copyright -->
          <tr>
            <td align="center" style="padding: 15px 20px;">
              <p style="color: #9ca3af; font-size: 11px; margin: 0; line-height: 1.4;">
                © 2025 Memora. Keeping your bookmarks safe and organized.
              </p>
            </td>
          </tr>
          
        </table>
        
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Forgot password email sent successfully to ${toEmail}`);
  } catch (error) {
    console.error(`❌ Failed to send email to ${toEmail}:`, error);
    throw error;
  }
}
