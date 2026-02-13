import mongoose from "mongoose";
import {Schema} from "mongoose";

const userschema = new Schema({

    fullName:{
        type:String,

        trim:true
    },

    username:{
        type:String,


        lowercase:true,
        trim:true
    },

    email:{
        type:String,
        required:true,
        unique:true
    },


    refreshToken:{
        type:String,
        default:null
    },
    vehicles:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Vehicle"
    }],

    avatar:{
        type:String,
    }





} , {timestamps: true});

export const User = mongoose.model("User", userschema);

