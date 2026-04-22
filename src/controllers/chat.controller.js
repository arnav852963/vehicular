import {ChatSession} from "../models/chat.model.js";
import {ApiError} from "../utilities/ApiError.js";
import {asyncHandler} from "../utilities/asyncHandler.js";
import {ApiResponse} from "../utilities/ApiResponse.js";
import mongoose from "mongoose";




export const getChatSession = asyncHandler(async (req, res) => {
    const {sessionId} = req?.params;

    if(!sessionId) throw new ApiError(400, "sessionId is required");

    const [chatSession] = await ChatSession.aggregate([{
        $match:{
            _id: new mongoose.Types.ObjectId(sessionId)
        }
    } , {

        $lookup:{
            from: "vehicles",
            localField: "vehicleId",
            foreignField: "_id",
            pipeline:[{
                $project: {
                    plateNumber: 1,
                }

            }],
            as: "vehicleInfo"
        }

    }])
    if (!chatSession) throw new ApiError(404, "chat session not found")


    const {messages=[]} = chatSession;

    return res.status(200).json(new ApiResponse(200, { messages , plateNumber : chatSession?.vehicleInfo?.plateNumber }, "chat session retrieved successfully"))
})



export const addMessageToChatSession = asyncHandler(async (req, res) => {
    const message = req?.body?.message;
    const {sessionId} = req?.params;

    if(!sessionId) throw new ApiError(400, "sessionId is required");
    if(!message) throw new ApiError(400, "message is required");

    const chatSession = await ChatSession.findByIdAndUpdate(sessionId , {
        $push:{
            messages: message
        }

    } , {new: true})

    if(!chatSession) throw new ApiError(404, "chat session not found")

    return res.status(200).json(new ApiResponse(200,{}, "message added to chat session successfully"))

})


export const deleteChatSession = asyncHandler(async (req, res) => {

    const {sessionId} = req?.params;

    if(!sessionId) throw new ApiError(400, "sessionId is required");

    const chatSession = await ChatSession.findByIdAndDelete(sessionId)

    if(!chatSession) throw new ApiError(404, "chat session not found")

    return res.status(200).json(new ApiResponse(200,{}, "chat session deleted successfully"))


})