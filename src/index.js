import dotenv from "dotenv"
dotenv.config({
  path: "./.env"
})
import {app} from "./app.js";
import {db} from "./db/index.js";
import {ApiError} from "./utilities/ApiError.js";
import {httpserver} from "./app.js";
import {transporter} from "./utilities/mailer.js";
import "./ws/index.js";

db().then(  async ()=>{

    try {

        await transporter.verify()
        console.log("mail transporter is ready to send mails");

    } catch (e) {

        console.log("error in mail transporter " , e.message);

    }

    httpserver.on('error' , (error) =>{

        throw new ApiError(500 , `error is ${error.message}`)
    })

  httpserver.listen(process.env.PORT , ()=>{
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