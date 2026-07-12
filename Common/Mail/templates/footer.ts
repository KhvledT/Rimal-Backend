import { BRAND_CONFIG } from "./brand.config.js";
import { EMAIL_STYLES } from "./styles.js";

export function buildFooterHtml(): string {
  return `
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="font-family: Montserrat, Arial, Helvetica, sans-serif; font-size: 15px; font-weight: bold; color: ${BRAND_CONFIG.colors.deepNavy}; padding-bottom: 2px;">
          ${BRAND_CONFIG.fullName}
        </td>
      </tr>
      <tr>
        <td align="center" style="font-family: Montserrat, Arial, Helvetica, sans-serif; font-size: 11px; font-weight: bold; color: ${BRAND_CONFIG.colors.gold}; letter-spacing: 2px; text-transform: uppercase; padding-bottom: 12px;">
          ${BRAND_CONFIG.tagline}
        </td>
      </tr>
      <tr>
        <td align="center" style="font-family: 'Open Sans', Arial, Helvetica, sans-serif; font-size: 12px; color: ${BRAND_CONFIG.colors.deepNavy}; padding-bottom: 4px; opacity: 0.8;">
          ${BRAND_CONFIG.address}
        </td>
      </tr>
      <tr>
        <td align="center" style="font-family: 'Open Sans', Arial, Helvetica, sans-serif; font-size: 12px; padding-bottom: 4px;">
          <a href="mailto:${BRAND_CONFIG.supportEmail}" style="${EMAIL_STYLES.footerLink}">${BRAND_CONFIG.supportEmail}</a>
        </td>
      </tr>
      <tr>
        <td align="center" style="font-family: 'Open Sans', Arial, Helvetica, sans-serif; font-size: 12px;">
          <a href="${BRAND_CONFIG.websiteUrl}" target="_blank" style="${EMAIL_STYLES.footerLink}">${BRAND_CONFIG.websiteUrl.replace("https://", "")}</a>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding-top: 16px; font-family: 'Open Sans', Arial, Helvetica, sans-serif; font-size: 10px; color: ${BRAND_CONFIG.colors.deepNavy}; opacity: 0.6;">
          &copy; ${new Date().getFullYear()} ${BRAND_CONFIG.fullName}. All rights reserved.
        </td>
      </tr>
    </table>
  `;
}

export function buildFooterText(): string {
  return `--\n${BRAND_CONFIG.fullName}\n${BRAND_CONFIG.tagline}\n${BRAND_CONFIG.address}\nEmail: ${BRAND_CONFIG.supportEmail}\nWebsite: ${BRAND_CONFIG.websiteUrl}`;
}
