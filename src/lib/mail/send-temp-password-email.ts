import { logInfo } from "@/lib/logger";

export async function sendTempPasswordEmail(params: {
  to: string;
  username: string;
  tempPassword: string;
}): Promise<void> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

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
      subject: "NRT Automation — Zugang freigeschaltet",
      text: `Hallo,\n\nIhr Antrag wurde genehmigt.\n\nBenutzerkennung: ${params.username}\nTemporäres Passwort: ${params.tempPassword}\n\nBitte ändern Sie das Passwort beim ersten Login.\n`,
    });
    logInfo({ action: "EMAIL_SENT", to: params.to, username: params.username });
    return;
  }

  logInfo({
    action: "EMAIL_SIMULATED",
    to: params.to,
    username: params.username,
  });
  console.log(
    JSON.stringify({
      kind: "temp_password_email",
      to: params.to,
      username: params.username,
      tempPassword: params.tempPassword,
    }),
  );
}
