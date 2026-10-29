import envConfig from '../../../config/config.js'
import { isValidObjectId } from "mongoose"
import { decrypt } from "../../common/utils/Security/encryption.security.js"
import UserRepository from "../../DB/Repositories/user.repository.js"
import { BadRequestException, ConflictException, NotFoundException } from "../../common/Utils/Errors/exception.error.js"
import { verifyToken } from '../../common/Utils/token.utils.js'

const userRepo = new UserRepository()

export const getAllUsers= async () => {
  
    const users = await userRepo.getAllUsers()
    if (!users.length) {
throw new NotFoundException("Users not found")
}
for (const user of users) {

    if(user.phoneNumber) { 
      
      user.phoneNumber = decrypt(user.phoneNumber)
    }

 
}
   return users

}
export const getProfileById= async (user) => {
  
  if(user.phoneNumber)  user.phoneNumber = decrypt(user.phoneNumber)
    return user
}

export const updateUser = async (userId , body) => {

  const {firstName, lastName, email ,gender , age , role} = body
  
 const user = await userRepo.findDocumentById(userId)
    
    if (firstName) user.firstName = firstName
    if (lastName) user.lastName = lastName
    if (email) {
        if (user.email==email)   throw new BadRequestException("old email match the new email");
        const isExistingUser = await userRepo.findUserByEmail(email)
        if (isExistingUser) {
        throw new ConflictException("Email already exists")
        }
        user.email = email
    }
    if (age) user.age = age
    if (gender) user.gender = gender
    if (role) user.role = role

    return user.save({runValidators:true})


}


export const deleteUser = async (userId) => {

    const user = await userRepo.findUserAndDelete(userId)
   return user

}
export const uploadProfilePicture= (file , user)=>{
return userRepo.updateDocument(user._id ,{profilePicture: file.path}, {new:true})
}