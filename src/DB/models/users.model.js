import mongoose from "mongoose";
import { genderEnum, providersEnum, roleEnum } from "../../common/constants.js";


const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        require: true,
        minLength: [3, 'First name must be at least 3 characters long'],
        maxLength: [30, 'First name must be at most 30 characters long'],
        lowercase: true,
        trim: true

    }, lastName: {
        type: String,
        require: true,
        minLength: [3, 'Last name must be at least 3 characters long'],
        maxLength: [30, 'Last name must be at most 30 characters long'],
        uppercase: true,
        trim: true

    },
    email: {
        type: String,
        require: true,
        index: { name: 'idx_email_unique', unique: true }

    },
    password: {
        type: String,
        require: true
    },
    gender: {
        type: String,
        enum:Object.values(genderEnum) ,
        default: genderEnum.MALE
    },
    age: {
        type: Number,
        min: [18, 'Age must be at least 18'],
        max: [100, 'Age must be at most 100'],
    },
    
     phoneNumber:String,
      profilePicture: String,
role: {
    type:String,
    enum:Object.values(roleEnum),
    default:roleEnum.USER
},
googleSub:{
type: String,
index:{
    name : "idx_google_sun_unique",
    unique:true
    
}
},
provider: {
    type:String,
    enum:Object.values(providersEnum),
    default:providersEnum.SYSTEM
},isEmailVerified:{
    type:Boolean,
    default:false
},isTwoStepVerification:{
    type:Boolean,
    default:false
}

}
,{
virtuals:{

    fullName:{
        get(){
            return `${this.firstName}_${this.lastName}`
        }
    }

},
toJSON:{virtuals:true}, 
toObject:{virtuals:true},
timestamps:true


})

const User= mongoose.model('User' , userSchema)
export default User