import {Router} from "express";
import * as userService from "./users.service.js"
import { authenticate } from "../../Middlewares/authentication.middleware.js";
import { authorize } from "../../Middlewares/authorization.middleware.js";
import { roleEnum } from "../../common/constants.js";
import { multerUpload } from "../../Middlewares/multer.middleware.js";
import { fileTypeFromFile } from "file-type";
const router = Router()

router.get('/' ,authenticate,authorize([roleEnum.ADMIN]),async (req,res)=>{

   const users = await userService.getAllUsers()
  res.json({message: "All Users ", data:users})
})

router.get('/profile' ,authenticate,authorize([roleEnum.USER]),async (req,res)=>{

        const userProfile = await userService.getProfileById(req.authUser)
  res.json({message: "User profile fetched successfully ", data:userProfile})
})
router.patch('/update',authenticate,authorize([roleEnum.ADMIN,roleEnum.USER]),async (req,res)=>{

      
      const {firstName, lastName, email ,gender , age ,role} = req.authUser
        const user = await userService.updateUser(req.authUser._id,{firstName, lastName, email ,gender , age ,role})
  res.json({message: "User updated successfully ", data:user})
})
router.delete('/delete',authenticate,authorize([roleEnum.ADMIN,roleEnum.USER]) ,async (req,res)=>{

        const user = await userService.deleteUser(req.authUser._id)
  res.json({message: "User deleted successfully ", data:user})
})

router.post('/profile-picture' ,authenticate, multerUpload({desiredPath:"profiles"}).single('profile') , async (req,res)=>{
const file  = req.file
if(!file){
   throw new BadRequestException("Please upload a picture file" , null , "MISSED_FILE");
}
const {authUser} = req
const result  = await userService.uploadProfilePicture(file ,authUser)
 res.json({message:"profile picture is uploaded successfully" , data:result}) 
})




export default router