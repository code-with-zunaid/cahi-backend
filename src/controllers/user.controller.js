import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose";


const generateAccessTokenAndRefreshTokens = async(userId)=>{
    try {
        const user =await User.findById(userId)
        const accessToken=user.generateAccessToken();
        const refreshToken=user.generateRefreshToken();

        user.refreshToken=refreshToken;
        await user.save({validateBeforeSave :false})

        return {accessToken,refreshToken}
    } catch (error) {
        throw new ApiError(500,"something went wrong while generating refresh and access token")
    }
}
   const registerUser = asyncHandler(async (req, res) => {
    // Extract user details from request body
    const { fullName, email, username, password } = req.body;

    // Validation - check if fields are empty
    if ([fullName, email, username, password].some(field => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    // Check if user already exists
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists");
    }

    // Check for avatar file
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage)&& req.files.coverImage.length>0)
    {
        coverImageLocalPath=req.files?.coverImage[0]?.path;
    } 

    // Upload images to Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null

    if (!avatar) {
        throw new ApiError(400, "Avatar upload failed");
    }

    // Create user in the database
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || null,
        email,
        password,
        username: username.toLowerCase()
    });

    // Fetch created user without password and refresh token
    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    // Return response
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    );
});


const loginUser =asyncHandler(async(req,res)=>{
    //req.body->data
    //username or email
    //find the user
    //password check
    //access and refresh token
    //send cookie
    const {email,username,password}=req.body;
    console.log(`email is ${email} and password is ${password}`);

    if(!(username || email))
    {
        throw new ApiError(401,"email or username is required")
    }

    const user=await User.findOne({
        $or:[{email},{username}]
    })


    if(!user)
    {
        throw new ApiError(401,"user does not exist")
    }

    /* const isPasswordValid=  await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401,"invalid user credentials")
    } */


    const isPasswordValid = await user.isPasswordCorrect(password)

   if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
    }

    const {refreshToken,accessToken}= await generateAccessTokenAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id)
    .select("-password -refreshToken")

    const option={
        httpOnly:true,
        secure:true
    }

    return res.status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken",refreshToken,option)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedInUser,accessToken
                ,refreshToken
            },
            "User logged In Successfully"
        )
    )




})

const logoutUser = asyncHandler(async(req,res)=>{
await User.findByIdAndUpdate(
    req.user._id,
    {
        $set:{
            refreshToken:undefined
        },
    },
    {
        new:true
    }
)

const option={
    httpOnly:true,
    secure:true
}

return res
.status(200)
.clearCookie("accessToken",option)
.clearCookie("refreshToken",option)
.json(new ApiResponse(200,{},"User logged Out"))

})


const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookie.refreshToken||req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401,"unauthorized request")
    }

    try {
        const decodedToken =jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError(401,"Invalid refresh token")
        }
    
        if(incomingRefreshToken !=user?.refreshToken){
            throw new ApiError(401,"Refresh Token is expired or used")
        }
    
        const option={
            httpOnly:true,
            secure:true
        }
    
        const {accessToken,newRefreshToken}= await generateAccessTokenAndRefreshTokens(user._id)
        return res
        .status(200)
        .cookie("accessToken",accessToken,option)
        .cookie("refreshToken",newRefreshToken,option)
        .json(
            new ApiResponse(
                200,
                {accessToken,refreshToken:newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401,error?.message || 
            "invalid refresh token")
    }



})


const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword}=user.body;
    const user= await findById(req.user?._id)
    if(!user){
        throw new ApiError(400,"user not found")
    }

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400,"Invalid old password")

    }
    user.password=newPassword;
    await user.save({validateBeforeSave:false})
    return res
    .status(200)
    .json(
        new ApiResponse(200,{},
             "password changed successfully")
    )



})

const getCurrentUser=asyncHandler(async(req,res)=>{
return res
.status(200)
.json(200,req.user,"current user fetched successfully")
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullName,email}=req.body
    if(!fullName || !email){
        throw new ApiError(400,"All fields are required")
    }

    const user=findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
            fullName,
            email:email
            }
        },
        {new:true}
    ).select("-password")
    return  res
    .status(200)
    .json(       
        new ApiResponse( 200,user,"User Account Detail Updated Successfully")
    )
})

const updateUserAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath=req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing")
    }
    const avatar=await uploadOnCloudinary(avatarLocalPath)
    if(!avatar.path){
        throw new ApiError(400,"Errer while uploading on avatar")
    }
    const user =await findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar?.path
            }
            

        },
        {
            new:true
        }
    ).select("-password")
    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"avatar uploaded successfully")
    )
})

const updatedUserCoverImage = asyncHandler(async(req,res)=>{
    const updatedUserCoverImageLocalPath=req.file?.path
    if(!updatedUserCoverImageLocalPath){
        throw new ApiError(400,"coverImage file is missing")
    }
    const coverImage=await uploadOnCloudinary(updatedUserCoverImageLocalPath)
    if(!avatar.path){
        throw new ApiError(400,"Errer while uploading on coverImage")
    }
    const user =await findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:updatedUserCoverImageLocalPath?.path
            }
            

        },
        {
            new:true
        }
    ).select("-password")
    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"coverImage uploaded successfully")
    )
})

const getUserChannelProfile = asyncHandler(async(req,res)=>{
    const {username}=req.params

    if(!username?.trim()){
        throw new ApiError(400,"username is missing")
    }

    const channel = await User.aggregate([
        {
            $match:{
                username:username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                },
                channelsSubscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in:[req.user?._id,"$subscribers.subscribe"]},
                        then:true,
                        else:false
                    }
                }

            }
        },
        {
            $project:{
                fullName:1,
                username:1,
                subscribersCount:1,
                channelsSubscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                email:1
            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(400,"Channel does not exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,channel[0],"user channel featched successfully")
    )

})



const getWatchHistory = asyncHandler(async(req,res)=>{
    const user = await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as: "watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from :"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                   $project:{
                                    fullName:1,
                                    username:1,
                                    avatar:1
                                   }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])
    return res
    .status(200)
    .json(
        new ApiResponse(200,
            user[0].getWatchHistory,
            "watch history fetched successfully"
        )
    )
})

export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updatedUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
 };

