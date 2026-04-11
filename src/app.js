import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import cookie from "cookie-parser"

import {createServer} from "http"
import {Server} from "socket.io";





dotenv.config({
    path:"./.env"
})

const app =express();

const httpserver = createServer(app)
const io = new Server(httpserver , {
    cors:{
        origin:process.env.CORS_ORIGIN,
        credentials:true
    }
})



app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}));

app.use(express.json({limit:'16kb'}));
app.use(express.urlencoded({extended:true,limit:'16kb'}));
app.use(express.static("public"));
app.use(cookie())

app.use((err, req, res, next) => {
    console.error(err);

    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
        errors: err.errors || []
    });
});

import authRoutes from "./routes/auth.routes.js";

app.use("/api/v1/auth",authRoutes)

import userRoutes from "./routes/user.routes.js";

app.use("/api/v1/user",userRoutes)

import vehicleRoutes from "./routes/vehicle.routes.js";
app.use("/api/v1/vehicle",vehicleRoutes)


import chatRoutes from "./routes/chat.route.js";
app.use("/api/v1/chat",chatRoutes)


export {httpserver , app  , io}