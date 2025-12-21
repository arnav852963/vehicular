import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({
    path:"./.env"
})
import {DB_NAME} from "../../DB_NAME.js";

export const db = async ()=>{
    try{
        const res =await mongoose.connect(process.env.MONGO_URL)
        console.log("connected to mongodb");
    } catch (e) {
        console.log("error in mongodb connection" , e.message);
        throw e;

    }
}