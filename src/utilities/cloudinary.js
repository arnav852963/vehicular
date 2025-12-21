import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
import { ApiError } from "./ApiError.js";

dotenv.config({
    path:'./.env'
})
console.log("check if .env" , process.env.CLOUDINARY_API_KEY)
cloudinary.config({
    cloud_name:process.env.CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
})
const upload = async (local_str)=> {
    try {

        if (!local_str) return "path not defined"/*throw new ApiError(401, "path empty")*/
        return await cloudinary.uploader.upload(local_str, {
            resource_type: "auto"
        })
    } catch (e){
        fs.unlinkSync(local_str)
        throw new ApiError(401,e.message)
    }
}
export {upload}