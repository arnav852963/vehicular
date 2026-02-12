import {User} from "../models/user.model.js";
import {ApiError} from "../utilities/ApiError.js";
import {ApiResponse} from "../utilities/ApiResponse.js";
import {asyncHandler} from "../utilities/asyncHandler.js";
import {AUDIT} from "../models/auditlogs.model.js";
import {createAccessRefreshToken} from "./auth.controller.js";
import {upload} from "../utilities/cloudinary.js";



import jwt from 'jsonwebtoken';
import dotenv from "dotenv";

dotenv.config({
    path: "./.env",
})

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
        .cookie('accessToken' , accessToken  , {http:true , secure:true})
        .json(new ApiResponse(200 , {accessToken: accessToken} , "token refreshed" ));











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
        .json(new ApiResponse(200 , req.user , "user logged out"));

})

const updateAvatar = asyncHandler(async (req, res) => {
   if(!req.file) throw new ApiError(401, "file not found");

   const local_avatar = req?.file?.path
    if(!local_avatar) throw new ApiError(401, "local avatar path not found");

    const upload_avatar = await upload(local_avatar);
    if(!upload_avatar.url) throw new ApiError(401, "avatar not uploaded to  cloud");

    const user = await User.findByIdAndUpdate(req?.user?._id  , {
        $set:{
            refreshToken: upload_avatar?.url
        }
    } , {new:true}).select("-refreshToken")

    if(!user) throw new ApiError(401, "user avatar not  updated");

    console.log(user.refreshToken);

    return res.status(200).json(new ApiResponse(200, {} , "user avatar updated"));



})

export {logout , getUser, refreshAccessToken , completeProfile , updateAvatar}



