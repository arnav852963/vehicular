import mongoose , {Schema} from "mongoose";

const auditlogSchema = new Schema({
    actorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    ipAddress: {
        type: String,
        required: true
    },


    action: {
        type: String,
        required: true,
        enum: [

            'USER_LOGIN',
            'USER_DELETED',
            'USER_UPDATED',
            "USER_LOGOUT",
            'VEHICLE_CREATED',
            'VEHICLE_DELETED',
            'QR_SCANNED',
            'ALERT_SENT',
            'CHAT_STARTED'
        ]
    },


    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false
    },
    targetModel: {
        type: String,
        enum: ['User', 'Vehicle', 'ChatSession'],
        required: false
    },





    timestamp: {
        type: Date,
        default: Date.now,
        expires: 2592000
    }


} , {timestamps: true});

export  const AUDIT = mongoose.model('Audit', auditlogSchema);