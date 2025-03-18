import jwt from "jsonwebtoken"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"

export const verifyJWT = asyncHandler(async(req, _ ,next)=>{
    try {
        const token=req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer","")
        
        console.log("token is :",token);
        

        if(!token){
            throw new ApiError(401,"Unauthorized request")
        }
    
        const decodedToken=jwt.verify(token,
            process.env.ACCESS_TOKEN_SECRET)
    
        console.log("decoded token is :",decodedToken)


       const user= await User.findById(decodedToken?._id)
       .select("-password -refreshToken") 
       
       
       
        console.log("user is :",user)

       if(!user){
        //NEXT VIDE disscuss about forntend
        throw new ApiError(401,"Invalid Access Token")
       }
    
       req.user=user
       next()
    } catch (error) {
        throw new ApiError(401,error?.message|| "inavalid acess token")
    }


})