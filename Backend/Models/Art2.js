import mongoose from 'mongoose'

const Art2Schema = new mongoose.Schema({
    src : {type: String , required : true},
    name : {type: String, required : true},
    inventor : {type: String},
    weight : {type: String},
    size : {type: String},
    type: {type: String},
    description: {type: String},
    price: {type: String}
}, {timestamps : true})
export default mongoose.model("Art2", Art2Schema)

    // {
    //     id : 1,
    //     src : hague,
    //     name : "The Hague",
    //     inventor : "Ryan McGuire",
    //     weight : "1.2kg",
    //     size : "2.5 metres",
    //     type : "artifact",
    //     description : "A beautiful invention that captures the essence of The Hague, showcasing its iconic architecture and vibrant culture.",
    //     price : "$320"
    // },