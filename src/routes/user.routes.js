import { Router } from "express";
import {
    logout,
    getUser,
    refreshAccessToken,
    completeProfile,
    updateAvatar,
} from "../controllers/user.controller.js";
import { jwt_auth} from "../middlewares/auth.middleware.js";
import {upload_mul} from "../middlewares/multer.middleware.js";

const userRoutes = Router();


userRoutes.route("/refreshToken").patch(refreshAccessToken);
userRoutes.route("/updateAvatar").patch(jwt_auth , upload_mul.single("avatar") ,  updateAvatar);


userRoutes.route("/getUser").get( jwt_auth, getUser);
userRoutes.route("/updateProfile").patch( jwt_auth, completeProfile);
userRoutes.route("/logout").patch( jwt_auth , logout);

export default userRoutes;