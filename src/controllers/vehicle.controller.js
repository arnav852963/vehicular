import {User} from "../models/user.model.js";
import {ApiError} from "../utilities/ApiError.js";
import {ApiResponse} from "../utilities/ApiResponse.js";
import {asyncHandler} from "../utilities/asyncHandler.js";
import {AUDIT} from "../models/auditlogs.model.js";
import {nanoid} from "nanoid";
import QRCode from "qrcode";
import {destroyByPublicId, upload} from "../utilities/cloudinary.js";
import {Vehicle} from "../models/vehicle.model.js";
import {ChatSession} from "../models/chat.model.js";
import dotenv from "dotenv";
import {generateAlertEmail, transporter} from "../utilities/mailer.js";
import {io} from "../app.js";
import { customAlphabet } from "nanoid";
import {detectVehicle} from "../utilities/cloudvision.js";

if (process.env.NODE_ENV !== "production") {
    dotenv.config({ path: "./.env" });
}

const createVehicle = asyncHandler(async (req, res) => {

    const uploadedAssets = [];
    try {


    const {vehicleType , plateNumber ,  description} = req?.body

    if(!vehicleType || !vehicleType.trim()   || !plateNumber  || !plateNumber.trim() ) throw new ApiError(400 , "vehicleType and plateNumber are required");

    if(!req?.user) throw new ApiError(400, "user not logged in");


    const nanoidUpperAlnum = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", 8)

    const uniqueQrId = nanoidUpperAlnum()



    if(!req?.files || !req?.files?.vehicleImages || req?.files?.vehicleImages?.length === 0) throw new ApiError(400 , "vehicle image is required");
    const localFilePathArray = req?.files?.vehicleImages

    const urls = [];

    for (const file of localFilePathArray) {
        if(!file?.path) throw new ApiError(400 , "image path is missing");
        const result = await upload(file?.path);
        if(!result || !result?.url) throw new ApiError(500 , "error in uploading image");
        urls.push(result?.url);

        if (result?.public_id) {
            uploadedAssets.push({ publicId: result.public_id, resourceType: result.resource_type || "image" })
        }
    }




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

    } catch (e) {
        if (uploadedAssets.length) {
            await Promise.allSettled(uploadedAssets.map((a) => destroyByPublicId(a.publicId, a.resourceType)))
        }
        throw e
    }








})

const activateDeactivateVehicleQr = asyncHandler(async (req, res) => {
console.log(req?.body)
    const {vehicleId} = req?.params;
    const {activate} = req?.body;
    if(activate.toString() === undefined) throw new ApiError(400, "activate field is required in body and must be a boolean")

    if (!vehicleId) throw new ApiError(400, "vehicleId is required");

    const vehicle = await Vehicle.findByIdAndUpdate(vehicleId , {
        $set:{
            activateQr: !activate
        }
    } , {new:true} ).select("activateQr owner")
    if (!vehicle) throw new ApiError(404, "vehicle not found")


    if (vehicle.owner.toString() !== req?.user?._id.toString()) throw new ApiError(403, "you are not authorized to update this vehicle")

    const {activateQr} = vehicle;

    return res.status(200).json(new ApiResponse(200, activateQr, `vehicle QR code ${vehicle?.activateQr ? "activated" : "deactivated"} successfully`))




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

    console.log(qrImage)

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
    const uploadedAssets = [];
    try {
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

        if (result?.public_id) {
            uploadedAssets.push({ publicId: result.public_id, resourceType: result.resource_type || "image" })
        }
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

    } catch (e) {
        if (uploadedAssets.length) {
            await Promise.allSettled(uploadedAssets.map((a) => destroyByPublicId(a.publicId, a.resourceType)))
        }
        throw e
    }





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
    let uploadedAsset = null;
    try {
    const {qrId} = req?.params;

    if(!qrId) throw new ApiError(400, "qrId is required");

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
    if(!vehicle?.activateQr) throw new ApiError(403, "QR code for this vehicle is deactivated")

    const  {message} = req?.body
    if(!message) throw new ApiError(400, "message must be there")
    const message_parsed = JSON.parse(message)

    console.log(" message---->" , message)

    message_parsed.timestamp = new Date().toLocaleString()


    const captured_local = req?.file ? req?.file?.path : ""
    if (!captured_local) throw new ApiError(400, "captured image is required")

    const captured_upload = await upload(captured_local);

    if (!captured_upload?.url) throw new ApiError(400, "uploaded image is required")

    if (captured_upload?.public_id) {
        uploadedAsset = { publicId: captured_upload.public_id, resourceType: captured_upload.resource_type || "image" }
    }

    const isVehicle = await detectVehicle(captured_upload?.url)
    if(isVehicle.error) throw new ApiError(400, isVehicle.message  + "kya badva giri hai ")
    if(!isVehicle.isVehicle) throw new ApiError(400, "no vehicle detected in the captured image")

    message_parsed.vehicleImage = captured_upload?.url






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


message_parsed.received  = true

    const chatSession = await ChatSession.create({
        vehicleId: vehicle._id,
        owner: vehicle.owner,
        messages:[message_parsed]
        
       



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






    io.to(vehicle.owner.toString()).emit('ALERT' , {
        sessionId : chatSession._id.toString()
    })







    return res.status(200).json(new ApiResponse(200, {

        sessionId: chatSession._id.toString(),
        ownerEmail: vehicle?.ownerInfo[0]?.email,
        plateNumber: vehicle?.plateNumber,
        messageSent: message_parsed?.message,

    }, "QR code scanned successfully"))

    } catch (e) {
        if (uploadedAsset?.publicId) {
            await destroyByPublicId(uploadedAsset.publicId, uploadedAsset.resourceType)
        }
        throw e
    }




})

const getVehicleByQrId = asyncHandler(async (req, res) => {
    const {qrId} = req?.params;

    if(!qrId) throw new ApiError(400, "qrId is required");

    const vehicle = await Vehicle.findOne({qrId}).select("plateNumber")
    if(!vehicle) throw new ApiError(404, "vehicle not found")

    return res.status(200).json(new ApiResponse(200, vehicle, "vehicle retracted successfully"))



})


const sendEmailToOwner = asyncHandler(async (req, res) => {

    const {ownerEmail , plateNumber , messageSent , sessionId} = req?.body;
    if(!ownerEmail || !ownerEmail.trim()) throw new ApiError(400, "ownerEmail is required")
    if(!plateNumber || !plateNumber.trim()) throw new ApiError(400, "plateNumber is required")
    if(!messageSent || !messageSent.trim()) throw new ApiError(400, "messageSent is required")
    if(!sessionId || !sessionId.trim()) throw new ApiError(400, "sessionId is required")



    try {


        const mailOptions = generateAlertEmail(ownerEmail, plateNumber, messageSent, sessionId)


        const info = await transporter.sendMail(mailOptions)
        if (!info) {

            const log = await AUDIT.create({
                actorId: null,
                ipAddress: req.ip,
                action:'EMAIL_FAILED',
                metadata:{
                    ownerEmail,
                    plateNumber,
                    sessionId
                } }  )

                if(!log) throw new ApiError(400 , `log was not created for email send failure`)


            throw new ApiError(500, "error in sending email")



        }

        const log = await AUDIT.create({
            actorId: null,
            ipAddress: req.ip,
            action:'EMAIL_SENT',
            metadata:{
                ownerEmail,
                plateNumber,
                sessionId
            } }  )

            if(!log) throw new ApiError(400 , `log was not created for email sent success`)

        res.status(200).json(new ApiResponse(200, {}, "alert email sent to vehicle owner successfully"))

    } catch (e) {

        const log = await AUDIT.create({
            actorId: null,
            ipAddress: req.ip,
            action:'EMAIL_FAILED',
            metadata:{
                ownerEmail,
                plateNumber,
                sessionId
            } }  )

        if(!log) throw new ApiError(400 , `log was not created for email send failure`)

        throw new ApiError(500, "error in sending alert email to vehicle owner")

    }







})



export {
    createVehicle,
    getVehicle,
    getAllUserVehicles,
    updateVehicleImage,
    deleteVehicle,
    qrScanned,
    getQr,
    getVehicleByQrId,
    activateDeactivateVehicleQr,
    sendEmailToOwner
}


