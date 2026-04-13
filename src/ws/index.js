import {io} from "../app.js";
import cookie from "cookie";
import {ApiError} from "../utilities/ApiError.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

import {socketHandler} from "./socketHandler.js";

dotenv.config(
    {
        path: './.env'
    }
)

console.log(process.env.ACCESS_TOKEN_SECRET)

io.use(async (socket , next) =>{

    const {sessionId =''} = socket?.handshake?.auth || {};
    if(!sessionId) console.log("reached here")




    const rawCookies   = socket?.handshake?.headers?.cookie;



    if(rawCookies) {
        try {


        const cookies = cookie.parse(rawCookies)

            console.log("parsed cookies " , cookies?.accessToken)
        if (!cookies) return  next(new ApiError(400, "cant parse the cookie"))

        const decodeToken = await jwt.verify(cookies?.accessToken, process.env.ACCESS_TOKEN_SECRET)

            console.log("decoded token " , decodeToken)
        if (!decodeToken) return  next( new ApiError(401, "Unauthorized"))

        socket.userType = 'owner'
        socket.userId = decodeToken?._id
            socket.sessionId =sessionId

        return next()
    } catch (e) {

            return next( new ApiError(500 , e.message) )
        }
    } else{

        socket.userType ='guest'
        socket.sessionId = sessionId
        return next()


    }



})


io.on('connection' , (socket) =>{

console.log("a user connected with id " , socket.id , "  type " , socket?.userType );

if(socket.userType === 'owner'){
    socket.join(socket?.userId)

}

socket.on('client_action' , (payload , callback)=>{
    if(payload?.type === "JOIN_ROOM"){
        if(!payload?.payload?.sessionId){
            return callback({success:false , message:"sessionId is required to join room"})
        }

        socket.join(payload?.payload?.sessionId)
        socket.sessionId = payload?.payload?.sessionId
        callback({success:true })
    }

    }
)

    socketHandler(io , socket)

    socket.on('disconnect' , ()=>{
    console.log("user disconnected with id " , socket.id)
    })













})