import { logInfo } from "@/lib/logger";

/**
 * Sends a password-reset link to the user.
 * Without SMTP config the payload is logged structurally (dev-mode).
 */
export async function sendResetPasswordEmail(params: {
  to: string;
  username: string;
  rawToken: string;
}): Promise<void> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, NEXTAUTH_URL } = process.env;
  const appUrl = NEXTAUTH_URL ?? "http://localhost:3000";
  const resetLink = `${appUrl}/reset-password?token=${params.rawToken}`;

  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT ?? 587),
      secure: false,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    await transporter.sendMail({
      from: SMTP_USER,
      to: params.to,
      subject: "NRT Automation — Passwort zurücksetzen",
      text: `Hallo ${params.username},\n\nPasswort zurücksetzen:\n${resetLink}\n\nDer Link ist 1 Stunde gültig. Falls Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail.\n`,
    });
    logInfo({ action: "RESET_EMAIL_SENT", to: params.to, username: params.username });
    return;
  }

  logInfo({ action: "RESET_EMAIL_SIMULATED", to: params.to, username: params.username });
  console.log(
    JSON.stringify({
      kind: "reset_password_email",
      to: params.to,
      username: params.username,
      resetLink,
    }),
  );
}
