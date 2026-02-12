
export const asyncHandler = (fun)=>{
   return async (req , res , next)=>{
       try{
           await fun(req , res , next)

       } catch (e) {
           console.log("error in asynchandler" , e.message);
           let statusCode = 0;
           if(e.statusCode>=100 && e.statusCode<=1000) statusCode=e.statusCode;
           else statusCode =500;
           res.status(statusCode).json({
               message:e.message,
               status: false,
               statusCode:statusCode

           })

       }
   }
}