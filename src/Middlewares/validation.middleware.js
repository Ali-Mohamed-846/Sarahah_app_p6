import { BadRequestException } from "../common/Utils/Errors/exception.error.js"

export const validation = (schema)=>{
return (req,res,next)=>{
    const validationResult = schema.safeParse({
        body :req.body,
        query: req.query,
        params: req.params
    })
    if (!validationResult.success){
      throw new BadRequestException("Validation Error" ,validationResult.error.issues )
    }
    req.validate = validationResult.data
    next()
}

}