import { BRAND_CONFIG } from "./brand.config.js";
import { EMAIL_STYLES } from "./styles.js";
import { buildFooterHtml } from "./footer.js";

export interface MailLayoutOptions {
  title: string;
  preheader?: string;
  contentHtml: string;
}

export function buildMailLayout({
  title,
  preheader,
  contentHtml,
}: MailLayoutOptions): string {
  const preheaderHtml = preheader
    ? `<div style="display: none; max-height: 0px; overflow: hidden; font-size: 1px; line-height: 1px; color: #ffffff; opacity: 0;">${preheader}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>${title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:AllowPNG/>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      background-color: ${BRAND_CONFIG.colors.sandWhite} !important;
      -webkit-font-smoothing: antialiased;
    }
    table {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    td, th {
      border-collapse: collapse;
    }
    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }
    @media screen and (max-width: 600px) {
      .responsive-table {
        width: 100% !important;
        max-width: 100% !important;
        border-radius: 0px !important;
        border-left: none !important;
        border-right: none !important;
      }
      .responsive-padding {
        padding: 30px 20px !important;
      }
      .responsive-header {
        padding: 28px 16px !important;
      }
      .responsive-otp {
        font-size: 32px !important;
        letter-spacing: 6px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; width: 100%; background-color: ${BRAND_CONFIG.colors.sandWhite};">
  ${preheaderHtml}

  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${BRAND_CONFIG.colors.sandWhite}; padding: 40px 10px;">
    <tr>
      <td align="center" valign="top">

        <!-- Main Card Container -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="responsive-table" style="${EMAIL_STYLES.container}">

          <!-- Header (Brand & Logo) -->
          <tr>
            <td align="center" class="responsive-header" style="${EMAIL_STYLES.header}">
              <a href="${BRAND_CONFIG.websiteUrl}" target="_blank" style="text-decoration: none; display: inline-block;">
                <table border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="${EMAIL_STYLES.headerLogoText}">
                      ${BRAND_CONFIG.fullName.toUpperCase()}
                    </td>
                  </tr>
                </table>
              </a>
            </td>
          </tr>

          <!-- Body Content Area -->
          <tr>
            <td class="responsive-padding" style="${EMAIL_STYLES.contentBody}">
              ${contentHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="responsive-padding" style="${EMAIL_STYLES.footer}">
              ${buildFooterHtml()}
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}
