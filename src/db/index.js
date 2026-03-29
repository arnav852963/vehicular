import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({
    path:"./.env"
})
import {DB_NAME} from "../../DB_NAME.js";

export const db = async ()=>{
    try{
        await mongoose.connect(process.env.MONGO_URL, {
            dbName: DB_NAME,
        })
        console.log(`connected to mongodb (db: ${DB_NAME})`);
    } catch (e) {
        console.log("error in mongodb connection" , e.message);
        throw e;

    }
}