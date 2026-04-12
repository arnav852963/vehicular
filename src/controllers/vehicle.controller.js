import {User} from "../models/user.model.js";
import {ApiError} from "../utilities/ApiError.js";
import {ApiResponse} from "../utilities/ApiResponse.js";
import {asyncHandler} from "../utilities/asyncHandler.js";
import {AUDIT} from "../models/auditlogs.model.js";
import {nanoid} from "nanoid";
import QRCode from "qrcode";
import {upload} from "../utilities/cloudinary.js";
import {Vehicle} from "../models/vehicle.model.js";
import {ChatSession} from "../models/chat.model.js";
import dotenv from "dotenv";
import {generateAlertEmail, transporter} from "../utilities/mailer.js";
import {io} from "../app.js";
import { customAlphabet } from "nanoid";

dotenv.config({
    path:"./.env"
});

const createVehicle = asyncHandler(async (req, res) => {


    const {vehicleType , plateNumber ,  description} = req?.body

    if(!vehicleType || !vehicleType.trim()   || !plateNumber  || !plateNumber.trim() ) throw new ApiError(400 , "vehicleType and plateNumber are required");

    if(!req?.user) throw new ApiError(400, "user not logged in");


    const nanoidUpperAlnum = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", 8)

    const uniqueQrId = nanoidUpperAlnum()


    const frontendScanUrl = `${process.env.FRONTEND_URL}/scan/${uniqueQrId}`;
    if(!req?.files || !req?.files?.vehicleImages || req?.files?.vehicleImages?.length === 0) throw new ApiError(400 , "vehicle image is required");
    const localFilePathArray = req?.files?.vehicleImages

    const urls = [];

    for (const file of localFilePathArray) {
        if(!file?.path) throw new ApiError(400 , "image path is missing");
        const result = await upload(file?.path);
        if(!result || !result?.url) throw new ApiError(500 , "error in uploading image");
        urls.push(result?.url);
    }

    const qrImage = await QRCode.toDataURL(frontendScanUrl, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 300,
        color: {
            dark: '#000000',
            light: '#ffffff'
        }
    });


    const vehicle = await Vehicle.create({
        vehicleType,
        plateNumber,
        description,
        qrId: uniqueQrId,
        isActive: true,
        owner: req?.user?._id,
        vehicleImage: urls
    })

    if(!vehicle) throw new ApiError(500 , "vehicle was not created");

    const log = await AUDIT.create({
        actorId: req?.user?._id,
        ipAddress: req.ip,
        action:'VEHICLE_CREATED',
        metadata:{
            vehicleId: vehicle._id,
            vehicleType: vehicle.vehicleType,
            plateNumber: vehicle.plateNumber,
        }

    })
    if(!log) throw new ApiError(400 , `log was not created for vehicle creation`)

    return res.status(201).json(new ApiResponse(201 , {

    } , "vehicle created successfully"))








})

const getVehicle = asyncHandler(async (req, res) => {

    const {vehicleId} = req?.params;

    if (!vehicleId) throw new ApiError(400, "vehicleId is required");

    const vehicle = await Vehicle.findById(vehicleId)
    if (!vehicle) throw new ApiError(404, "vehicle not found")
    if (vehicle.owner.toString() !== req?.user?._id.toString()) throw new ApiError(403, "you are not authorized to view this vehicle")


    const frontendScanUrl = `${process.env.FRONTEND_URL}/scan/${vehicle?.qrId}`;

    const qrImage = await QRCode.toDataURL(frontendScanUrl, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 300,
        color: {
            dark: '#000000',
            light: '#ffffff'
        }
    });

    return res.status(200).json(new ApiResponse(200, {vehicle , qrImage}, "vehicle retracted successfully"))
})



const getQr = asyncHandler(async (req, res) => {

    const {vehicleId} = req?.params;

    if (!vehicleId) throw new ApiError(400, "vehicleId is required");

    const vehicle = await Vehicle.findById(vehicleId)
    if (!vehicle) throw new ApiError(404, "vehicle not found")
    if (vehicle.owner.toString() !== req?.user?._id.toString()) throw new ApiError(403, "you are not authorized to view this vehicle")


    const frontendScanUrl = `${process.env.FRONTEND_URL}/scan/${vehicle?.qrId}`;

    const qrImage = await QRCode.toDataURL(frontendScanUrl, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 300,
        color: {
            dark: '#000000',
            light: '#ffffff'
        }
    });


    return res.status(200).json(new ApiResponse(200, {

        qrImage
    }, "QR code retracted successfully"))







})


const getAllUserVehicles = asyncHandler(async (req, res) => {
    const vehicles = await Vehicle.find({owner: req?.user?._id})
    if(!vehicles) throw new ApiError(404, "cant fetch vehicles for this user")

    return res.status(200).json(new ApiResponse(200, vehicles, "vehicles retracted successfully"))
})


const updateVehicleImage = asyncHandler(async (req, res) => {
        const {vehicleId} = req?.params;
    if (!vehicleId) throw new ApiError(400, "vehicleId is required");

    if(!req?.files || !req?.files?.vehicleImages || req?.files?.vehicleImages?.length === 0) throw new ApiError(400 , "vehicle image is required");

    const localUrls = req?.files?.vehicleImages
    const urls = [];

    for (const file of localUrls) {
        if(!file?.path) throw new ApiError(400 , "image path is missing");
        const result = await upload(file?.path);
        if(!result || !result?.url) throw new ApiError(500 , "error in uploading image");
        urls.push(result?.url);
    }

    const vehicle = await Vehicle.findByIdAndUpdate(vehicleId , {
        $addToSet:{
            vehicleImage: {$each: urls}
        }
    } , {new:true} )

 if(!vehicle) throw new ApiError(404, "vehicle not found")
    if (vehicle.owner.toString() !== req?.user?._id.toString()) throw new ApiError(403, "you are not authorized to update this vehicle")

    const log = await AUDIT.create({
        actorId: req?.user?._id,
        ipAddress: req.ip,
        action:'VEHICLE_IMAGE_UPDATED',
        metadata:{
            vehicleId: vehicle._id,
            vehicleType: vehicle.vehicleType,
            plateNumber: vehicle.plateNumber,
        } }  )



        if(!log) throw new ApiError(400 , `log was not created for vehicle image update`)
    return res.status(200).json(new ApiResponse(200, vehicle, "vehicle image updated successfully"))





})


const deleteVehicle = asyncHandler(async (req, res) => {
    const {vehicleId} = req?.params;
    if (!vehicleId) throw new ApiError(400, "vehicleId is required");
    if (!req?.user?._id) throw new ApiError(401, "user not logged in");

    const vehicle = await Vehicle.findByIdAndDelete(vehicleId);
    if (!vehicle) throw new ApiError(404, "vehicle not found");
    if (vehicle.owner.toString() !== req?.user?._id.toString()) {
        throw new ApiError(403, "you are not authorized to delete this vehicle");
    }



    const log = await AUDIT.create({
        actorId: req?.user?._id,
        ipAddress: req.ip,
        action: 'VEHICLE_DELETED',
        metadata: {
            vehicleId: vehicle._id,
            vehicleType: vehicle.vehicleType,
            plateNumber: vehicle.plateNumber,
        }
    })


    if(!log) throw new ApiError(400 , `log was not created for vehicle delete`)

    return res.status(200).json(new ApiResponse(200, {vehicleId}, "vehicle deleted successfully"))
})


const qrScanned = asyncHandler(async (req, res) => {
    const {qrId} = req?.params;

    if(!qrId) throw new ApiError(400, "qrId is required");

    const {message} = req?.body
    if(!message) throw new ApiError(400, "message must be a string")

    const [vehicle] = await Vehicle.aggregate([{
        $match:{
            "qrId": qrId
        }


    } , {

        $lookup:{
            from:"users",
            localField:"owner",
            foreignField:"_id",
            as:"ownerInfo"
        }


    }])
    if(!vehicle ) throw new ApiError(404, "vehicle not found")

    const log_1 = await AUDIT.create({
        actorId: null,
        ipAddress: req.ip,
        action:'QR_SCANNED',
        metadata:{
            vehicleId: vehicle._id,
            vehicleType: vehicle.vehicleType,
            plateNumber: vehicle.plateNumber,
        } }  )


        if(!log_1) throw new ApiError(400 , `log was not created for qr scanned`)




    const chatSession = await ChatSession.create({
        vehicle: vehicle._id,
        owner: vehicle.owner,
        messages:[message]
        
       



    })
    
    if(!chatSession) throw new ApiError(500, "chat session was not created")
    
    const log_2 = await AUDIT.create({
        actorId: null,
        ipAddress: req.ip,
        action:'CHAT_STARTED',
        metadata:{
            vehicleId: vehicle._id,
            vehicleType: vehicle.vehicleType,
            plateNumber: vehicle.plateNumber,
            chatSessionId: chatSession._id
        } }  )


        if(!log_2) throw new ApiError(400 , `log was not created for chat session creation`)


    io.to(vehicle.owner.toString()).emit('Alert' , {
        sessionId : chatSession._id.toString()
    })







    const mailOptions = generateAlertEmail(vehicle?.ownerInfo?.email , vehicle?.plateNumber , message?.message || "" , chatSession?._id)


    try {
            const info = await transporter.sendMail(mailOptions)
            if(!info) throw new ApiError(500, "error in sending email")

    } catch (e){

            throw new ApiError(500, "error in sending alert email to vehicle owner")

    }



    return res.status(200).json(new ApiResponse(200, {

        guestSessionId: chatSession._id.toString(),

    }, "QR code scanned successfully"))




})

const getVehicleByQrId = asyncHandler(async (req, res) => {
    const {qrId} = req?.params;

    if(!qrId) throw new ApiError(400, "qrId is required");

    const vehicle = await Vehicle.findOne({qrId}).projection({
        plateNumber: 1
    })
    if(!vehicle) throw new ApiError(404, "vehicle not found")

    return res.status(200).json(new ApiResponse(200, vehicle, "vehicle retracted successfully"))



})



export {
    createVehicle,
    getVehicle,
    getAllUserVehicles,
    updateVehicleImage,
    deleteVehicle,
    qrScanned,
    getQr,
    getVehicleByQrId
}


