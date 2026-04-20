import {io} from "../app.js";
import cookie from "cookie";
import {ApiError} from "../utilities/ApiError.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

import {socketHandler} from "./socketHandler.js";

if (process.env.NODE_ENV !== "production") {
    dotenv.config({ path: "./.env" })
}

io.use(async (socket , next) =>{

    const auth = socket?.handshake?.auth || {};


if(!auth || Object.keys(auth).length === 0) {


    console.log("no auth found in the handshake, trying to parse cookies")
    const rawCookies = socket?.handshake?.headers?.cookie;

    if(!rawCookies) return next(new ApiError(400, "sessionId and senderType are required in auth or cookies"))



        try {


            const cookies = cookie.parse(rawCookies)


            if (!cookies) return next(new ApiError(400, "cant parse the cookie"))

            const decodeToken = await jwt.verify(cookies?.accessToken, process.env.ACCESS_TOKEN_SECRET)


            if (!decodeToken) return next(new ApiError(401, "Unauthorized"))

            socket.userType = 'owner'
            socket.userId = decodeToken?._id

            socket.sessionId = undefined

            return next()
        } catch (e) {
        console.log("indhr hi error" , e)
            return next(new ApiError(401, e?.message || "Unauthorized"))

        }


}

    const {sessionId ='' , senderType =""} = auth

    if(!sessionId || !senderType) {
        return next(new ApiError(400, "sessionId and senderType are required in auth or cookies"))

    }







    if(senderType ==="owner" ) {
        try {
            const rawCookies   = socket?.handshake?.headers?.cookie;
            if(!rawCookies) return next(new ApiError(400, "sessionId and senderType are required in auth or cookies"))


        const cookies = cookie.parse(rawCookies)


        if (!cookies) return next(new ApiError(400, "cant parse the cookie"))

        const decodeToken = await jwt.verify(cookies?.accessToken, process.env.ACCESS_TOKEN_SECRET)


        if (!decodeToken) return next(new ApiError(401, "Unauthorized"))

        socket.userType = 'owner'
        socket.userId = decodeToken?._id
            socket.sessionId =sessionId

        return next()
    } catch (e) {

            return next( new ApiError(500 , e.message) )
        }
    } else{

        console.log("no cookies found in the handshake")

        socket.userType ='guest'
        socket.sessionId = sessionId
        return next()


    }



})


io.on('connection' , (socket) =>{

console.log("a user connected with id " , socket.id , "  type " , socket?.userType );

if(socket.userType === 'owner'){

    console.log("joining room with id " , socket?.userId)
    socket.join(socket?.userId)

}

socket.on('client_action' , (payload , callback)=>{
    if(payload?.type === "JOIN_ROOM"){
        if(!payload?.payload?.sessionId){
            return callback({success:false , message:"sessionId is required to join room"})
        }

        socket.join(payload?.payload?.sessionId)
        console.log("session id joined" , socket.userType)
        socket.sessionId = payload?.payload?.sessionId
        callback({success:true })
    }

    }
)

    socketHandler(io , socket)

    socket.on('disconnect' , ()=>{
    socket.emit('DISCONNECTED' )
    })













})