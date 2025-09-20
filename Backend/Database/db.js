
import mongoose from 'mongoose'

// export const dbConnection = mongoose.connect(process.env.DB_URL, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
// }).then(() => {
//     console.log('Database connected successfully')
// }).catch((error) => {
//     console.error('Database connection error:', error)
// })

export const connectDB  = async () => {
    try{
        console.log("mongo_uri:", process.env.MONGO_URI);
        const conn = await mongoose.connect(process.env.MONGO_URI)
        console.log(`MongoDB Connected: ${conn.connection.host}`)
        
    }catch (error) {
        console.log("Error connecting to MongoDB:", error.message)
        process.exit(1)
    }
}
