import {User} from "../models/user.model.js";
import {ApiError} from "../utilities/ApiError.js";
import {ApiResponse} from "../utilities/ApiResponse.js";
import {asyncHandler} from "../utilities/asyncHandler.js";
import {AUDIT} from "../models/auditlogs.model.js";
import {createAccessRefreshToken} from "./auth.controller.js";
import {destroyByPublicId, upload} from "../utilities/cloudinary.js";
import {ChatSession} from "../models/chat.model.js";


import jwt from 'jsonwebtoken';
import dotenv from "dotenv";
import mongoose from "mongoose";

if (process.env.NODE_ENV !== "production") {
    dotenv.config({ path: "./.env" })
}

const accessCookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 24 * 60 * 60 * 1000,
}

const refreshCookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000,
}

const completeProfile = asyncHandler(async (req, res) => {
    const {username  ,  fullName} = req.body;
    if(!username.trim() || !fullName.trim()) throw new ApiError(400 , "Username and Phone number is required");

    if(!req?.user) throw new ApiError(400, "user not logged in");

    const user = await User.findByIdAndUpdate(req?.user?._id , {
        $set:{
            fullName,
            username,
        }
    } , {new:true} );

    if(!user) throw new ApiError(500, "user not updated");

    const log = await AUDIT.create({
        actorId: user._id,
        ipAddress: req.ip,
        action:'USER_UPDATED',



    })
    if(!log) throw new ApiError(400 , `log was not created for login`)

   return  res.status(200).json(new  ApiResponse(200 , {} , "profile completed"))


})

const getUser = asyncHandler(async (req, res) => {
    if(!req?.user?._id) throw new ApiError(400, "user not logged in");
    const user = await User.findById(req?.user?._id).select("-refreshToken")
    if(!user) throw new ApiError(401, "user not found");

    res.status(200).json(new ApiResponse(200, user , "user retracted"));


})


const refreshAccessToken = asyncHandler(async (req, res) => {

    const token = req?.cookies?.refreshToken;

    if(!token) throw new ApiError(401, "refresh token not found");

    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    if(!decoded) throw new ApiError(401, "refresh token not found");
    const user = await User.findById(decoded._id)


    if(!user) throw new ApiError(401, "user not found");

    const {accessToken, refreshToken} = await createAccessRefreshToken(user);

    if(!accessToken) throw new ApiError(401, "accessToken not found");

    return res.status(200)
        .cookie('accessToken' , accessToken  , accessCookieOptions)
        .json(new ApiResponse(200 , {} , "token refreshed" ));











})

const logout = asyncHandler(async (req, res) => {

    const user = await User.findByIdAndUpdate(req?.user?._id , {
        $set:{
            refreshToken: null
        }
    }, {new:true}  );
    if(!user) throw new ApiError(401, "user not found");

    const log = await AUDIT.create(({
        actorId: user._id,
        ipAddress: req.ip,
        action:'USER_LOGOUT',
    }))
    if(!log) throw new ApiError(401, "log was not created")
    return res.status(200)
        .clearCookie('accessToken')
        .clearCookie('refreshToken')
        .json(new ApiResponse(200 , req.user , "user logged out"));

})

const updateAvatar = asyncHandler(async (req, res) => {
    let uploaded = null;
    try {
        if(!req.file) throw new ApiError(401, "file not found");

        const local_avatar = req?.file?.path
        if(!local_avatar) throw new ApiError(401, "local avatar path not found");

        uploaded = await upload(local_avatar);
        if(!uploaded?.url) throw new ApiError(401, "avatar not uploaded to cloud");

        const user = await User.findByIdAndUpdate(req?.user?._id  , {
            $set:{
                avatar: uploaded?.url
            }
        } , {new:true}).select("-refreshToken")

        if(!user) throw new ApiError(401, "user avatar not updated");

        return res.status(200).json(new ApiResponse(200, {} , "user avatar updated"));
    } catch (e) {
        if (uploaded?.public_id) {
            await destroyByPublicId(uploaded.public_id, uploaded.resource_type || "image")
        }
        throw e
    }



})

const getUserChatSessions = asyncHandler(async (req, res) => {

    const userChats  = await User.aggregate([{
        $match:{
            _id: new mongoose.Types.ObjectId(req?.user?._id)
        }
    } , {
        $lookup:{
            from:"chatsessions",
            localField:"_id",
            foreignField:"owner",
            pipeline: [{
                $project:{
                    _id: 1,
                    firstMessage: 1,
                }
            }],
            as:"chats"
        }



    } , {

        $project:{

            chats: 1


        }
    }])

    if(!userChats || userChats?.length === 0) throw new ApiError(404, "no chat sessions found for user");



    const {chats} = userChats[0]

    return res.status(200).json(new ApiResponse(200, chats  , "user chat sessions retracted"));

})

export {logout , getUser, refreshAccessToken , completeProfile , updateAvatar , getUserChatSessions}



