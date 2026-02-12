import admin from "firebase-admin"
import dotenv from "dotenv";
dotenv.config({
    path:"./.env"
})

import fs from "fs"
import path from "path"

const servicePath = path.resolve(process.env.FIREBASE_API_KEY)

await admin.initializeApp({
    credential: admin.credential.cert(JSON.parse( fs.readFileSync(servicePath , "utf-8") ))
});

console.log("firebase admin initialized");




export  {admin}