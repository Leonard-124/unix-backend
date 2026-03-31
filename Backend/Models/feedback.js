import mongoose from "mongoose"

const feedbackSchema = new mongoose.Schema({
    email:{
        type:String,
        required:true
    },
    message:{
        type:String,
        required:true,
        maxLength: 550
    },
    date:{
        type: Date,
    }
},{timestamps: true})

export default mongoose.model("feedback", feedbackSchema)