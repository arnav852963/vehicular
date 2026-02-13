import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import cookie from "cookie-parser"



dotenv.config({
    path:"./.env"
})

const app =express();

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}));

app.use(express.json({limit:'16kb'}));
app.use(express.urlencoded({extended:true,limit:'16kb'}));
app.use(express.static("public"));
app.use(cookie())

import authRoutes from "./routes/auth.routes.js";

app.use("/api/v1/auth",authRoutes)

import userRoutes from "./routes/user.routes.js";

app.use("/api/v1/user",userRoutes)

export {app}