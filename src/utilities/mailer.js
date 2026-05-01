import nodemailer from "nodemailer";
import dotenv from "dotenv";
if (process.env.NODE_ENV !== "production") {
    dotenv.config({ path: "./.env" })
}
export const transporter = nodemailer.createTransport({
    host:"smtp.gmail.com",
    secure: true,
    port: Number(process.env.EMAIL_PORT) || 587,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    connectionTimeout: 10000,
    tls: {
        rejectUnauthorized: false
    }
});


export const generateAlertEmail = (ownerEmail, plateNumber, messageText, sessionId) => {

    const base = process.env.FRONTEND_URL || "http://localhost:5173";
    const chatLink = `${base}/chat/${sessionId}`;

    return {
        from: `"ParkAlert System" <${process.env.EMAIL_USER}>`,
        to: ownerEmail,
        subject: `Vehicle Notification: Action needed for ${plateNumber}`,


        text: `Someone is at your vehicle (${plateNumber}). Message: "${messageText}". Tap here to reply: ${chatLink}`,


        html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <h2 style="color: #18181b; margin-top: 0;">Vehicle Alert</h2>
                <p style="color: #3f3f46;">Someone scanned the QR code for your vehicle (<strong>${plateNumber}</strong>).</p>
                
                <div style="background-color: #f4f4f5; border-left: 4px solid #10b981; padding: 12px 16px; margin: 20px 0; border-radius: 4px;">
                    <p style="margin: 0; font-style: italic; color: #27272a;">"${messageText}"</p>
                </div>
                
                <p style="color: #3f3f46; margin-bottom: 24px;">Tap the button below to instantly connect with them in a secure, real-time chat.</p>
                
                <a href="${chatLink}" style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                    Open Live Chat
                </a>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0 20px 0;" />
                <p style="font-size: 12px; color: #a1a1aa; text-align: center; margin: 0;">Automated notification from ParkAlert.</p>
            </div>
        `
    };
};