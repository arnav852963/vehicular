import {Router} from "express";
import {getChatSession} from "../controllers/chat.controller.js";
import {exp} from "qrcode/lib/core/galois-field.js";

const chatRoutes = Router();


chatRoutes.route("/getChatsById/:sessionId").get((getChatSession))

export default chatRoutes;