import { UNauthorizedException } from "../common/Utils/Errors/exception.error.js"

export const authorize = (allowedRoles) => {
return (req,res,next)=>{
    const loggedInUseRole = req.authUser.role
    if (!allowedRoles.includes(loggedInUseRole)) {
        throw new UNauthorizedException("User is not authorized to access this resource", null, 'FORBIDDEN')
    }
    next()
}
}