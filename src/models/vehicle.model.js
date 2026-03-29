import mongoose , {Schema} from "mongoose";

const vehicleModel = new Schema({
    vehicleType:{
        type: String,
        required:true,
        trim:true
    },
    qrId:{
        type:String,
        required:true
    }
} , {timestamps:true})