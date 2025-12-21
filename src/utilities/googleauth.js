import { OAuth2Client } from "google-auth-library";
import dotenv from "dotenv";
dotenv.config({
    path:"./.env"
})

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const verifyGoogleToken = async (token) => {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID
    });
    return ticket.getPayload();
};
