import nodemailer from "nodemailer";
import { getRequiredEnv } from "@/lib/env";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
    if (transporter) return transporter;
    transporter = nodemailer.createTransport({
        host: getRequiredEnv("SMTP_HOST"),
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
            user: getRequiredEnv("SMTP_USER"),
            pass: getRequiredEnv("SMTP_PASSWORD"),
        },
    });
    return transporter;
}

export async function sendEmail(to: string, subject: string, text: string) {
    const from = process.env.SMTP_FROM ?? getRequiredEnv("SMTP_USER");
    await getTransporter().sendMail({ from, to, subject, text });
}
