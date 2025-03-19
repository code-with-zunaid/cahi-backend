import mongoose,{Schema} from "mongoose";
const subsciptionSchema=new Schema({
    subscriber:{
        type:Schema.Types.ObjectId,//one who is subcribing
        ref:"User"
    },
    channel:{
        type:Schema.Types.ObjectId ,//one to whom 'subsciber' is subcribing
        ref:"User"
    }
},{timestamps:true})

export const Subsciption = mongoose.model("Subsciption",subsciptionSchema)