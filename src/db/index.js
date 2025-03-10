import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

const connectDB=async ()=>{
    
    try {
        
        const connectionInstant=await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstant.connection.host}`)
    } catch (error) {
        console.log("MONGODB CONNECTION FAILED",error)
        process.exit(1)
    }
}

export default connectDB