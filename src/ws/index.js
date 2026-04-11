import {io} from "../app.js";
import cookie from "cookie-parser";
import {ApiError} from "../utilities/ApiError.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";

dotenv.config(
    {
        path: './.env'
    }
)

console.log(process.env.ACCESS_TOKEN_SECRET)

io.use(async (socket , next) =>{

    const sessionId = socket?.handshake?.auth?.sessionId

    if(!sessionId) return next( new ApiError(400, "Session ID is required"))



    const rawCookies   = socket?.handshake?.headers?.cookie;

    if(rawCookies) {
        try {


        const cookie = cookie.parse(rawCookies)
        if (!cookie) return  next(new ApiError(400, "cant parse the cookie"))

        const decodeToken = await jwt.verify(cookie?.accessToken, process.env.ACCESS_TOKEN_SECRET)
        if (!decodeToken) return  next( new ApiError(401, "Unauthorized"))

        socket.userType = 'owner'
        socket.userId = decodeToken?._id

        return next()
    } catch (e) {

            return next( new ApiError(500 , e.message) )
        }
    } else{

        socket.userType ='guest'


    }



})


io.on('connection' , (socket) =>{

console.log("a user connected with id " , socket.id);




})