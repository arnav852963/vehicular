import dotenv from "dotenv";

if (process.env.NODE_ENV !== "production") {
    dotenv.config({ path: "./.env" });
}

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_BASE = process.env.BREVO_API_BASE || "https://api.brevo.com/v3";

async function brevoRequest(path, { method = "GET", body } = {}) {
    if (!BREVO_API_KEY) {
        throw new Error("BREVO_API_KEY is missing");
    }

    const res = await fetch(`${BREVO_API_BASE}${path}`, {
        method,
        headers: {
            "api-key": BREVO_API_KEY,
            "content-type": "application/json",
            accept: "application/json"
        },
        body: body ? JSON.stringify(body) : undefined
    });

    const text = await res.text();
    let json;
    try {
        json = text ? JSON.parse(text) : null;
    } catch {
        json = null;
    }

    if (!res.ok) {
        const msg =
            (json && (json.message || json.error || json.code)) ||
            text ||
            `Brevo request failed (${res.status})`;
        const err = new Error(String(msg));
        err.statusCode = res.status;
        err.details = json;
        throw err;
    }

    return json;
}

function parseFrom(from) {
    const fallbackEmail = process.env.EMAIL_FROM_EMAIL || process.env.BREVO_SENDER_EMAIL || process.env.BREVO_SMTP_USER;
    const fallbackName = process.env.EMAIL_FROM_NAME || "ParkAlert System";

    if (!from) {
        return { email: fallbackEmail, name: fallbackName };
    }

    if (typeof from === "string") {
        const match = from.match(/^(?:\s*"?([^"<]+)"?\s*)?<([^>]+)>\s*$/);
        if (match) {
            return { name: (match[1] || fallbackName).trim(), email: match[2].trim() };
        }
        return { email: from.trim(), name: fallbackName };
    }

    if (typeof from === "object" && from.address) {
        return { email: String(from.address), name: from.name ? String(from.name) : fallbackName };
    }

    return { email: fallbackEmail, name: fallbackName };
}

function parseRecipients(value) {
    if (!value) return [];
    if (Array.isArray(value)) {
        return value
            .map((v) => (typeof v === "string" ? { email: v } : v && v.address ? { email: v.address, name: v.name } : null))
            .filter(Boolean);
    }
    if (typeof value === "string") {
        return value
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean)
            .map((email) => ({ email }));
    }
    if (typeof value === "object" && value.address) {
        return [{ email: value.address, name: value.name }];
    }
    return [];
}

export const transporter = {
    async verify() {
        await brevoRequest("/account", { method: "GET" });
        return true;
    },

    async sendMail(mailOptions = {}) {
        const sender = parseFrom(mailOptions.from);
        if (!sender.email) {
            throw new Error("EMAIL_FROM_EMAIL (or BREVO_SENDER_EMAIL) is missing");
        }

        const to = parseRecipients(mailOptions.to);
        if (!to.length) {
            throw new Error("Missing recipient: to");
        }

        const payload = {
            sender,
            to,
            subject: mailOptions.subject || "",
            textContent: mailOptions.text || undefined,
            htmlContent: mailOptions.html || undefined
        };

        const out = await brevoRequest("/smtp/email", { method: "POST", body: payload });

        return {
            messageId: out?.messageId,
            accepted: to.map((r) => r.email),
            rejected: [],
            response: JSON.stringify(out)
        };
    }
};


export const generateAlertEmail = (ownerEmail, plateNumber, messageText, sessionId) => {

    const base = process.env.FRONTEND_URL || "http://localhost:5173";
    const chatLink = `${base}/chat/${sessionId}`;

    return {
        from: process.env.EMAIL_FROM || `"ParkAlert System" <${process.env.BREVO_SMTP_USER || process.env.EMAIL_USER}>`,
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