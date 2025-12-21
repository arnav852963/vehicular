import dotenv from "dotenv";
dotenv.config({
  path: "./.env"
})
import {app} from "./app.js";
import {db} from "./db/index.js";
import {ApiError} from "./utilities/ApiError.js";

db().then(()=>{
  app.listen(process.env.PORT , ()=>{
    console.log("running at " , process.env.PORT);
  })
  app.on('error' , (error) =>{
    console.log("error for listening " , error);
    throw error;
  })
})
    .catch((e)=>{
      throw new ApiError(500 , `error in mongo ->${e.message}`)

    })