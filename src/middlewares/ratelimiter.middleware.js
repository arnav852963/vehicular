import rateLimit from "express-rate-limit";

export const rate_limit = rateLimit({
    windowMs:15*60*100,
    max:20,
    message:"DDoS krega madarchoddd...",
    standardHeaders:true,
    legacyHeaders:false
})

export const auth_Limiter = rateLimit({
    windowMs:5*60*100,
    max:3,
    message:"bruteforce na hoooparooo",
    standardHeaders:true,
    legacyHeaders:false
})