import {Router} from "express";
import {addMessageToChatSession, getChatSession} from "../controllers/chat.controller.js";
import {exp} from "qrcode/lib/core/galois-field.js";

const chatRoutes = Router();


chatRoutes.route("/getChatsById/:sessionId").get((getChatSession))
chatRoutes.route("/addMessageToChat/:sessionId").patch(addMessageToChatSession)

export default chatRoutes;