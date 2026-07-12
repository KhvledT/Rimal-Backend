import { buildOtpTemplate } from "./otp.template.js";
import { buildMailLayout } from "./layout.js";

export function getSignupOtpTemplate(otp: string): { html: string; text: string } {
  const { html: contentHtml, text } = buildOtpTemplate({
    otp,
    expiresInMinutes: 10,
  });

  const html = buildMailLayout({
    title: "Verify Your Email Address",
    preheader: "Verify your email address to complete your RIMAL account registration.",
    contentHtml,
  });

  return { html, text };
}
