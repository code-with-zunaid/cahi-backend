import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

const connectDB=async ()=>{
    console.log("hi this is zunaid alam ")
    try {
        console.log("MONGODB_URI:", process.env.MONGODB_URI);

        const connectionInstant=await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstant.connection.host}`)
    } catch (error) {
        console.log("MONGODB CONNECTION ERROR",error)
        process.exit(1)
    }
}

export default connectDB