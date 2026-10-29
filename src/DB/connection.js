import mongoose from 'mongoose'
import envConfig from '../../config/config.js'
 const dbConnection = async ()=>{
    try {
    await mongoose.connect(envConfig.database.url)
    console.log("Database connected successfully")
    } catch (error) {
        console.log("Database connection failed",error)
    }
  
}
 
export default dbConnection