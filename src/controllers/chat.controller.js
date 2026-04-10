import {ChatSession} from "../models/chat.model.js";
import {ApiError} from "../utilities/ApiError.js";
import {asyncHandler} from "../utilities/asyncHandler.js";
import {ApiResponse} from "../utilities/ApiResponse.js";




export const getChatSession = asyncHandler(async (req, res) => {
    const {sessionId} = req?.params;

    if(!sessionId) throw new ApiError(400, "sessionId is required");

    const chatSession = await ChatSession.findById(sessionId).select("-vehicleId -owner -createdAt")
    if (!chatSession) throw new ApiError(404, "chat session not found")


    const {messages} = chatSession;

    return res.status(200).json(new ApiResponse(200, messages, "chat session retrieved successfully"))
})