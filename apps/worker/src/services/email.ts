import "dotenv/config";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const from = process.env.EMAIL_FROM;

if (!from) {
  throw new Error("EMAIL_FROM is not configured");
}

const emailFrom: string = from;

export type ChangeEmailData = {
  recipient: string;
  monitorName: string;
  monitorUrl: string;
  severity: "minor" | "moderate" | "major";
  additions: string;
  removals: string;
};

export async function sendChangeEmail(data: ChangeEmailData) {
  const { error } = await resend.emails.send({
    from: emailFrom,
    to: data.recipient,
    subject: `Change detected: ${data.monitorName}`,
    text: [
      `Watchtower detected a change.`,
      "",
      `Monitor: ${data.monitorName}`,
      `URL: ${data.monitorUrl}`,
      `Severity: ${data.severity}`,
      "",
      `Added:`,
      data.additions || "(none)",
      "",
      `Removed:`,
      data.removals || "(none)",
    ].join("\n"),
  });

  if (error) {
    throw new Error(error.message);
  }
}
