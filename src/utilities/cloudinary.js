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
        try {
            if (local_str && fs.existsSync(local_str)) fs.unlinkSync(local_str)
        } catch (_) {

        }
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

// Starts uploading every path in parallel; returns one promise per path, in the same order
const uploadAll = (paths) => paths.map((path) => upload(path).then((result) => {
    if (!result?.url) throw new ApiError(500, "error in uploading image")
    return result
}))

// Waits for every upload and splits them into the ones that succeeded and the ones that failed
const settleUploads = async (uploadPromises) => {
    const settled = await Promise.allSettled(uploadPromises)
    return {
        uploaded: settled.filter((s) => s.status === "fulfilled").map((s) => s.value),
        failed: settled.filter((s) => s.status === "rejected").map((s) => s.reason)
    }
}

// Downscaled https URL of an uploaded image, generated on the fly by Cloudinary
const resizedImageUrl = (result, width = 512) => cloudinary.url(result.public_id, {
    secure: true,
    version: result.version,
    format: "jpg",
    transformation: [{ width, crop: "limit", quality: "auto" }]
})

export {upload, uploadAll, settleUploads, destroyByPublicId, resizedImageUrl}
