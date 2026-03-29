import mongoose from "mongoose"

const personalSchema = new mongoose.Schema({
    username:{
        type: String,
        required: true,
    },
    phone:{
        type: Number,
        require: true,
    },
    address:{
        type: String,
        required:true,
    },
    country: {
        type: String,
        required: true
    },
    city:{
        type: String,
        required: true
    },
    postalCode:{
        type:String
    },
    auth0Id: {
        type: String,
        required: true
    }

},{timestamps: true })

export default mongoose.model("personaldetails", personalSchema);