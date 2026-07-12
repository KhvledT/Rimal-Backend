import { BRAND_CONFIG } from "./brand.config.js";
import { EMAIL_STYLES } from "./styles.js";
import { buildFooterText } from "./footer.js";

export interface OtpTemplateOptions {
  otp: string;
  expiresInMinutes?: number;
}

export function buildOtpTemplate({
  otp,
  expiresInMinutes = 10,
}: OtpTemplateOptions): { html: string; text: string } {
  const html = `
    <!-- Title -->
    <h1 style="${EMAIL_STYLES.title}">Verify Your Email Address</h1>

    <!-- Gold Accent Divider -->
    <hr style="${EMAIL_STYLES.goldDivider}">

    <!-- Greeting -->
    <p style="${EMAIL_STYLES.greeting}">Hello,</p>

    <p style="${EMAIL_STYLES.paragraph}">
      Thank you for creating your RIMAL account. Use the verification code below to complete your registration.
    </p>

    <!-- Large Centered OTP Card -->
    <div style="${EMAIL_STYLES.otpCard}">
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center" style="font-family: Montserrat, Arial, Helvetica, sans-serif; font-size: 11px; font-weight: bold; color: ${BRAND_CONFIG.colors.gold}; letter-spacing: 2px; text-transform: uppercase; padding-bottom: 12px; line-height: 1;">
            Verification Code
          </td>
        </tr>
        <tr>
          <td align="center">
            <span class="responsive-otp" style="${EMAIL_STYLES.otpText}">${otp}</span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Expiration Notice -->
    <p style="${EMAIL_STYLES.noticeText}">
      This verification code expires in <strong>${expiresInMinutes} minutes</strong>.
    </p>

    <!-- Security Notice -->
    <p style="${EMAIL_STYLES.securityNotice}">
      If you did not request this verification code, please ignore this email.<br>
      No changes will be made to your account.
    </p>
  `;

  const text = `Verify Your Email Address

Hello,

Thank you for creating your RIMAL account.
Use the verification code below to complete your registration.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Verification Code: ${otp}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This verification code expires in ${expiresInMinutes} minutes.

If you did not request this verification code, please ignore this email.
No changes will be made to your account.

${buildFooterText()}`;

  return { html, text };
}
