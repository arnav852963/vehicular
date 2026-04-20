import admin from "firebase-admin"
import dotenv from "dotenv";
dotenv.config({
    path:"./.env"
})



await admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_API_KEY))
});

console.log("firebase admin initialized");




export  {admin}
