import axios from "axios";
import dotenv from "dotenv";
dotenv.config({
    path: "./.env",
});

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY_WEB // From Firebase Settings -> General
const GOOGLE_ID_TOKEN = "eyJhbGciOiJSUzI1NiIsImtpZCI6ImMyN2JhNDBiMDk1MjlhZDRmMTY4MjJjZTgzMTY3YzFiYzM5MTAxMjIiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI0MDc0MDg3MTgxOTIuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI0MDc0MDg3MTgxOTIuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMTYxNTgwODA0ODE2MzU5NzU5OTEiLCJlbWFpbCI6ImFybmF2dGlja3VAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImF0X2hhc2giOiJRdWxYNV80VW5Vb3RiblBwRnNWUXlBIiwiaWF0IjoxNzcwNzM0NjM5LCJleHAiOjE3NzA3MzgyMzl9.bt9naYpc8IB6x_syVZ2cudz_nIIOEkE4tfCeA1qOjOqQB5XVyfW4RgWjXHzgNt1WtCKCSbgOn_EttEdzOOHUISyK2WZU2JDHx80wSWzmPfPtBqiwRQ-TBTi8aATr_3dYv7Or7WYxC7umFAdkQA02r3C7DdnNW7EytS1HMkULsNV1uopb4S6E0eDV66RdL3kW0fbX5bSlT0qoZ12hqxOxZE3SYEWKv-FKqBANKJwG2yU3IZsiorrxD4tAN3K8d6jrUlDaIYmmWiomcMgy-3rSZ3eYNIVUSnworbazGlvstpKT6lmDoSvn9VJIgAmGRE6kiMqzoCZixhNSgygYwsnmjw";

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