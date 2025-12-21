// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, sendEmailVerification } from "firebase/auth";

import dotenv from "dotenv";

dotenv.config({
    path: "./.env"
});

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
console.log(process.env.FIREBASE_API_KEY_WEB, "<<<<<<<<<<");

// Your Firebase configuration details
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY_WEB,
    authDomain: "esd-backend-c06e8.firebaseapp.com",
    projectId: "esd-backend-c06e8",
    storageBucket: "esd-backend-c06e8.firebasestorage.app",
    messagingSenderId: "647707566634",
    appId: "1:647707566634:web:6d12a5869f89dc52435953",
    measurementId: "G-7TH62PF083"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// User credentials for sign-in
const email = "arnav23100@iiitnr.edu.in";
const password = "arnav123";

// Action Code Settings for email verification link
// IMPORTANT: The `url` below MUST be a URL that is whitelisted in your
// Firebase Console -> Authentication -> Settings -> Authorized domains.
// This is where the user will be redirected after clicking the verification link.
const actionCodeSettings = {
    url: 'https://www.google.com', // <--- REPLACE WITH YOUR ACTUAL DOMAIN
    handleCodeInApp: true, // Set to true to handle the link in your app (if it's a mobile app)
    // For web apps, `handleCodeInApp` set to true means it will open in the same browser tab.
    // iOS: {
    //   bundleId: 'com.example.ios'
    // },
    // android: {
    //   packageName: 'com.example.android',
    //   installApp: true,
    //   minimumVersion: '12'
    // },
    // dynamicLinkDomain: 'your-dynamic-link-domain.page.link' // Only if using Firebase Dynamic Links
};


signInWithEmailAndPassword(auth, email, password)
    .then(async (userCredential) => {
        const user = userCredential.user;
        console.log("✅ User signed in:", user.email);
        if (user.emailVerified) {
            console.log("✅ Email is verified!");
            const idToken = await user.getIdToken();
            console.log("✅ ID Token (email verified):", idToken);
            // Proceed with authenticated actions

        }
        else {
            console.log("Email is NOT verified. Sending verification email...");
            // Send email verification
            await sendEmailVerification(user, actionCodeSettings)
                .then(async () => {
                    console.log("Verification email sent successfully!");
                    console.log("Please check your inbox (and spam folder) to verify your email.");
                    const idToken = await user.getIdToken();
                    console.log("✅ ID Token (email not   verified , first time login):", idToken);
                    // You might want to display a message to the user here
                })
                .catch((error) => {
                    console.error("Error sending verification email:", error.message);
                    // Handle specific errors, e.g., 'auth/too-many-requests'
                });
        }

        // Get ID token even if email is not verified.
        // Note: The 'email_verified' claim in this token will still be false.


    })
    .catch((error) => {
        console.error("Error signing in:", error.message);
        // Handle authentication errors (e.g., wrong password, user not found)
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error(`Error Code: ${errorCode}`);
    });
