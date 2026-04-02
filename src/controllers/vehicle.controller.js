import {User} from "../models/user.model.js";
import {ApiError} from "../utilities/ApiError.js";
import {ApiResponse} from "../utilities/ApiResponse.js";
import {asyncHandler} from "../utilities/asyncHandler.js";
import {AUDIT} from "../models/auditlogs.model.js";
import {nanoid} from "nanoid";
import QRCode from "qrcode";
import {upload} from "../utilities/cloudinary.js";
import {Vehicle} from "../models/vehicle.model.js";


const createVehicle = asyncHandler(async (req, res) => {


    const {vehicleType , plateNumber ,  label} = req?.body

    if(!vehicleType || !vehicleType.trim()   || !plateNumber  || !plateNumber.trim() ) throw new ApiError(400 , "vehicleType and plateNumber are required");

    if(!req?.user) throw new ApiError(400, "user not logged in");


    const uniqueQrId = nanoid(8);


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
        label,
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
        vehicleId: vehicle._id,
        qrId: vehicle.qrId,
        qrImage
    } , "vehicle created successfully"))








})

const getVehicle = asyncHandler(async (req, res) => {

    const {vehicleId} = req?.params;

    if (!vehicleId) throw new ApiError(400, "vehicleId is required");

    const vehicle = await Vehicle.findById(vehicleId)
    if (!vehicle) throw new ApiError(404, "vehicle not found")
    if (vehicle.owner.toString() !== req?.user?._id.toString()) throw new ApiError(403, "you are not authorized to view this vehicle")

    return res.status(200).json(new ApiResponse(200, vehicle, "vehicle retracted successfully"))
})


const getAllUserVehicles = asyncHandler(async (req, res) => {
    const vehicles = await Vehicle.find({owner: req?.user?._id})
    if(!vehicles) throw new ApiError(404, "cant fetch vehicles for this user")
    if(vehicles?.length === 0) throw new ApiError(404, "no vehicles found for this user")
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