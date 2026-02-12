import {Router} from "express";
import {firebaseAuth, googleAuth} from "../controllers/auth.controller.js";

const authRoutes = Router();

authRoutes.route("/firebaseAuth").post(firebaseAuth)

authRoutes.route("/googleAuth").get(googleAuth)

export default authRoutes;