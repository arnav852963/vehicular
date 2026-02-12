import {User} from "../models/user.model.js";
import {ApiError} from "../utilities/ApiError.js";
import {ApiResponse} from "../utilities/ApiResponse.js";
import {asyncHandler} from "../utilities/asyncHandler.js";

import {admin} from "../utilities/firebaseAdmin.js";
import {AUDIT} from "../models/auditlogs.model.js";
import jwt from 'jsonwebtoken';
import dotenv from "dotenv";

dotenv.config({
    path: "./.env",
})




export const createAccessRefreshToken = async (user) => {

    const  accessToken =  jwt.sign(

        {
            _id:user._id,
            email:user.email,


    } ,
        process.env.ACCESS_TOKEN_SECRET,
        process.env.ACCESS_TOKEN_EXPIRY



    )

    const refreshToken = jwt.sign(
        {
            _id:user._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        process.env.REFRESH_TOKEN_EXPIRY
    )

    const refreshedUser = await User.findByIdAndUpdate(user._id  , {
        $set:{
            refreshToken:refreshToken
        }

    } , {new:true});

    if(refreshedUser) throw new ApiError(500 , "user was not able to refresh")

    return {accessToken:accessToken, refreshToken:refreshToken}



}



const googleAuth = asyncHandler(async (req, res) => {

    const {idToken} = req.body
    if(!idToken) throw new ApiError(400 , `id token is missing`);
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    if(!decodedToken) throw new ApiError(400 , `token is unauthorised`);
    const {name , email , picture} = decodedToken;
    if(!name) throw new ApiError(400 , `name is missing`);
    if(!email) throw new ApiError(400 , `email is missing`);
    if(!picture) throw new ApiError(400 , `picture is missing`);

    const exist = await User.findOne({
        email: email,
    })
    if(exist){

        const {accessToken, refreshToken} = await createAccessRefreshToken(exist)

        if(!accessToken) throw new ApiError(400 , `accessToken is missing`)
        if(!refreshToken) throw new ApiError(400 , `refreshToken is missing`)

        const options  = {
            http: true,
            secure:true
        }

        const log = await AUDIT.create({
            actorId: exist._id,
            ipAddress: req.ip,
            action:'USER_LOGIN',



        })
        if(!log) throw new ApiError(400 , `log was not created for login`)




       return res.status(201)
            .cookie('accessToken', accessToken, options)
            .cookie('refreshToken', refreshToken, options)
            .json(new ApiResponse(201  , {} , "user created and authorised"))




    }


    const user = await User.create({
        fullName: name,
        email: email,
        avatar: picture,
    })

    if(!user) throw new ApiError(400 , `user not created`);

    const  {accessToken, refreshToken} = await createAccessRefreshToken(user)

    if(!accessToken) throw new ApiError(400 , `accessToken is missing`)
    if(!refreshToken) throw new ApiError(400 , `refreshToken is missing`)

    const options  = {
        http: true,
        secure:true
    }

    const log = await AUDIT.create({
        actorId: exist._id,
        ipAddress: req.ip,
        action:'USER_LOGIN',



    })
    if(!log) throw new ApiError(400 , `log was not created for login`)

   return  res.status(201)
        .cookie('accessToken', accessToken, options)
        .cookie('refreshToken', refreshToken, options)
        .json(new ApiResponse(201  , {} , "user created and authorised"))





})

const firebaseAuth = asyncHandler(async (req, res) => {

    const {idToken} = req.body
    if(!idToken) throw new ApiError(400 , `id token is missing`);
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    if(!decodedToken) throw new ApiError(400 , `token is unauthorised`);
    const { email , email_verified} = decodedToken;
    if(!email) throw new ApiError(400 , `email is missing`);
    if(!email_verified) throw new ApiError(400 , `email is not verified`);

    const exist = await User.findOne({
        email: email,
    })
    if(exist){

        const {accessToken, refreshToken} = await createAccessRefreshToken(exist)

        if(!accessToken) throw new ApiError(400 , `accessToken is missing`)
        if(!refreshToken) throw new ApiError(400 , `refreshToken is missing`)

        const options  = {
            http: true,
            secure:true
        }

        const log = await AUDIT.create({
            actorId: exist._id,
            ipAddress: req.ip,
            action:'USER_LOGIN',



        })
        if(!log) throw new ApiError(400 , `log was not created for login`)

        return res.status(201)
            .cookie('accessToken', accessToken, options)
            .cookie('refreshToken', refreshToken, options)
            .json(new ApiResponse(201  , {} , "user created and authorised"))




    }

    const user = await User.create({

        email: email,

    })

    if(!user) throw new ApiError(400 , `user not created`);

    const  {accessToken, refreshToken} = await createAccessRefreshToken(user)

    if(!accessToken) throw new ApiError(400 , `accessToken is missing`)
    if(!refreshToken) throw new ApiError(400 , `refreshToken is missing`)

    const options  = {
        http: true,
        secure: true

    }

    const log = await AUDIT.create({
        actorId: exist._id,
        ipAddress: req.ip,
        action:'USER_LOGIN',



    })
    if(!log) throw new ApiError(400 , `log was not created for login`)


    return  res.status(201)
        .cookie('accessToken', accessToken, options)
        .cookie('refreshToken', refreshToken, options)
        .json(new ApiResponse(201  , {} , "user created and authorised"))





})

export {googleAuth , firebaseAuth}

