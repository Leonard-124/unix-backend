
import mongoose from 'mongoose'


const signUpSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    ConfirmPassword: {
        type: String,
        required: true,
        minlength: 6
    },
    Phone: {
        type: String,
      required: true,
      unique: true,
      trim: true,
      match: [/^\d{10,15}$/, 'Please use a valid phone number with 10 to 15 digits'],
    }
})

const SignUp = mongoose.model('SignUp', signUpSchema);3

 export default SignUp;