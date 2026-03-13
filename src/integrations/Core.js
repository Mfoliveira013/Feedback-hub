import { post } from "@/api/httpClient";

export async function SendEmail({ to, subject, html, text }) {
  if (!to) {
    throw new Error("Destinatario do e-mail nao informado");
  }

  return post("/integrations/send-email", {
    to,
    subject: subject || "",
    html: html || "",
    text: text || "",
  });
}

