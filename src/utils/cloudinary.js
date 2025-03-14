import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
})


const uploadOnCloudinary=async (loacalFilePath)=>{
    try {
        if(!loacalFilePath) return null;
        // file upload on cloudinary
        const response=cloudinary.uploader.upload(
            loacalFilePath,{
                resource_type:"auto",
            }
        )
        console.log("file is uploaded on cloudnary", response.url);
        return response;
    } catch (error) {
        fs.unlinkSync(loacalFilePath)//remove the locally saved temporary fileas the upload operation got failed
        return null;
    }
}

export {uploadOnCloudinary}
