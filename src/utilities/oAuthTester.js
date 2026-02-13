import axios from "axios";
import dotenv from "dotenv";
dotenv.config({
    path: "./.env",
});

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY_WEB // From Firebase Settings -> General
const GOOGLE_ID_TOKEN = "eyJhbGciOiJSUzI1NiIsImtpZCI6ImMyN2JhNDBiMDk1MjlhZDRmMTY4MjJjZTgzMTY3YzFiYzM5MTAxMjIiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI0MDc0MDg3MTgxOTIuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI0MDc0MDg3MTgxOTIuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMTYxNTgwODA0ODE2MzU5NzU5OTEiLCJlbWFpbCI6ImFybmF2dGlja3VAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImF0X2hhc2giOiJScENZcFhUbTZUenZCQ0lTT1M3WjhBIiwiaWF0IjoxNzcwOTY0MjcxLCJleHAiOjE3NzA5Njc4NzF9.bxu6bjBVXdpOPoSnzBcLX5CV5I8TntEXnw-OtvP1FQJyVe-WrEaqXP6sFxZvZK32OxDW-v_78K9dv4jbmtxeBvAsBnD_ZHpaYrn2KOpn_kIRjuTkFD3WSvwDHqfYLdN2TP2CHPRLhZKV-rpR-pi45T1ySLcPY8l36LlDWvO73jhVGW0HE3IYpZSfQP9EAJNWPZ0MqL1Sy3asp_laMD6jIverQ71U6aCxzMlwk4W2VMbalm-4VPjjCFmeDRpx__ePttADzx7Cssgq4uOgTttefHCFIPk-msJ5Gdv5lwWLvVis33K3vv6o0QDNFby14LKq6RC3h0T4obz1FS3tA117wg"

async function getFirebaseToken() {
    try {
        const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${FIREBASE_API_KEY}`;

        const response = await axios.post(url, {
            // "postBody" must be a URL-encoded string
            postBody: `id_token=${GOOGLE_ID_TOKEN}&providerId=google.com`,
            requestUri: "http://localhost",
            returnSecureToken: true,
            returnIdpCredential: true
        });

        const firebaseIdToken = response.data.idToken;
        console.log("✅ Success! Your Firebase ID Token is:");
        console.log(firebaseIdToken);

        return firebaseIdToken;
    } catch (error) {
        console.error("❌ Error:", error.response?.data || error.message);
    }
}

getFirebaseToken();