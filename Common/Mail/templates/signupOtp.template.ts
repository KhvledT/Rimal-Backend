export function getSignupOtpTemplate(otp: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #1a365d; text-align: center;">Welcome to Rimal</h2>
      <p>Thank you for initiating your registration. Please use the verification code below to complete your signup process:</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2b6cb0; background-color: #ebf8ff; padding: 10px 20px; border-radius: 4px; border: 1px dashed #bee3f8;">
          ${otp}
        </span>
      </div>
      <p style="color: #718096; font-size: 14px;">This code is valid for 15 minutes and can only be used once. If you did not request this, you can safely ignore this email.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="color: #a0aec0; font-size: 12px; text-align: center;">Rimal Trading & Investments Group &copy; 2026</p>
    </div>
  `;
}
