import {ApiError} from "../utilities/ApiError.js";
import jwt from 'jsonwebtoken';

export  const  jwt_auth = async (req, _ , next) => {

    try {

        const token =   req?.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        if(!token) throw new ApiError(500, "Token not found  , please login");
        const decodedToken = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        if(!decodedToken) throw new ApiError(500, "unauthorised token , unsecure");

        req.user = decodedToken;
        next();




    } catch (e){
        console.log("error in jwt_auth" , e.message);
        throw new ApiError(500,`error in jwt_auth ${e.message}`);

    }
}