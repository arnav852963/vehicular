import mongoose , {Schema} from "mongoose";

const chatModel = new Schema({
    vehicleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: true,
    },

    owner:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },



    message:[{
        senderType:{
            type: String,
            enum: ['Owner', 'guest'],
            required: true
        },
        message:{
            type: String,
             required: true

        },
        attachment:{
            type: String,
        }

        ,
        timestamp:{
            type: Date,
            default: Date.now
        }
    }]
} , {timestamps: true});



export const ChatSession = mongoose.model('ChatSession', chatModel);