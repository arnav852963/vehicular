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



    messages:[{
        senderType:{
            type: String,
            enum: ['owner', 'guest'],
            required: true
        },
        message:{
            type: String,
             required: true

        },

        timestamp:{
            type: Date,
            default: Date.now
        }
    }],

    createdAt: {
        type: Date,
        default: Date.now,
        expires: 86400 
    }
} , {timestamps: true});



export const ChatSession = mongoose.model('ChatSession', chatModel);