import {ChatSession} from "../models/chat.model.js";





export const socketHandler =  (io , socket) =>{

    socket.on("client_action" , async (payload , callback)=>{



            if( payload?.type ===   "SEND_NEW_MESSAGE") {
                const {sessionId , text , id} = payload?.payload
                if(!sessionId || !text || !id){
                    callback({success: false , message: "Invalid payload"})
                    return
                }

                socket.to(sessionId).emit("NEW_MESSAGE" , {
                    senderType: socket?.userType,
                    message: text,
                    id: id
                })

                callback({success: true , message: "Message sent successfully"})

                try {
                    const newMessage = await ChatSession.findByIdAndUpdate(sessionId, {
                        $push: {
                            messages: {
                                senderType: socket?.userType,
                                message: text,
                                timestamp: new Date().toLocaleString(),
                                id: id
                            }
                        }


                    }, {new: true})
                    if (!newMessage) {
                        console.log("Failed to add message to db")
                    }


                } catch (e) {
                   console.log(  "cant add message to db" ,  e)
                }





            }






    })


    socket.on("client_action" , async (payload , callback)=>{


        switch (payload?.type) {

            case "TYPING":{
                socket.to(socket?.sessionId).emit("TYPING" )

                break;
            }

            case "STOP_TYPING":{

                socket.to(socket?.sessionId).emit("STOP_TYPING" )

                break;

            }

            case "RECEIVED":{

                socket.to(socket?.sessionId).emit("MESSAGE_RECEIVED" , payload?.payload)

                try {

                    const receivedMessage = await ChatSession.findOneAndUpdate(
                        { "messages.id": payload?.payload },
                        { $set: { "messages.$.received": true } },
                        { new: true }
                    )

                    if(!receivedMessage) {
                        return callback?.({success:false , message:"Failed to update message as received in db"})
                    }

                    return callback?.({success:true})
                } catch (e) {
                    return callback?.({success:false , message: e?.message || "Failed to update message as received"})
                }

                break;

            }

            default:{
                console.log("Unknown action type: " , payload?.type)
            }

        }


    })



}