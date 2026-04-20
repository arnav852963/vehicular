import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
import { ApiError } from "./ApiError.js";

if (process.env.NODE_ENV !== "production") {
    dotenv.config({ path: "./.env" })
}
cloudinary.config({
    cloud_name:process.env.CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
})
const upload = async (local_str)=> {
    try {

        if (!local_str) return "path not defined"/*throw new ApiError(401, "path empty")*/
        const result = await cloudinary.uploader.upload(local_str, {
            resource_type: "auto"
        })


        try {
            if (local_str && fs.existsSync(local_str)) fs.unlinkSync(local_str)
        } catch (_) {

        }

        return result
    } catch (e){
        fs.unlinkSync(local_str)
        throw new ApiError(401,e.message)
    }
}

const destroyByPublicId = async (publicId, resourceType = "image") => {
    try {
        if (!publicId) return null
        return await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
    } catch (e) {
        // don't throw from cleanup
        return null
    }
}

export {upload, destroyByPublicId}
