import { Router } from "express";
import {
    logout,
    getUser,
    refreshAccessToken,
    completeProfile,
    updateAvatar,
} from "../controllers/user.controller.js";
import { jwt_auth} from "../middlewares/auth.middleware.js";

const userRoutes = Router();


userRoutes.route("/refreshToken").post(refreshAccessToken);
userRoutes.route("/updateAvatar").patch( updateAvatar);


userRoutes.route("/getUser").get( getUser);
userRoutes.route("/updateProfile").patch( completeProfile);
userRoutes.route("/logout").post( logout);

export default userRoutes;