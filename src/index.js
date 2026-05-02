import dotenv from "dotenv";

if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: "./.env" });
}
import {app} from "./app.js";
import {db} from "./db/index.js";
import {ApiError} from "./utilities/ApiError.js";
import {httpserver} from "./app.js";
import {transporter} from "./utilities/mailer.js";
import "./ws/index.js";

db().then(  async ()=>{

    try {
        await transporter.verify();
        console.log("mail transporter is ready to send mails");
    } catch (e) {
        console.log("error in mail transporter ", e?.message || e);
    }

    httpserver.on('error' , (error) =>{

        throw new ApiError(500 , `error is ${error.message}`)
    })

  const PORT = process.env.PORT || 8000;

  httpserver.listen(PORT, () => {
    console.log("running at ", PORT);

  })
  app.on('error' , (error) =>{
    console.log("error for listening " , error);
    throw error;
  })
})
    .catch((e)=>{
        console.log("error in mongo connection" , e.message);
      throw new ApiError(500 , `error in mongo ->${e.message}`)


    })