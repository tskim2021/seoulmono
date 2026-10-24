import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER?.trim(),
    pass: process.env.SMTP_PASS?.trim(),
  },
});

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
}) {
  const from = `"지구쇼핑몰 고객센터" <${process.env.SMTP_USER?.trim()}>`;
  await transporter.sendMail({ from, ...opts });
}
