import { z } from "zod";

export const loginSchema =  z.strictObject({
    email: z.email({error:"please provide valid email format"}),
    password:z.string().regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{6,}$/ ,{error: "password must be at least 8 characters and includes at least one digit, at least one lowercase and at least one uppercase"})
    })

    export const login = z.object({
        body : loginSchema,
        query : z.strictObject({
            lang : z.enum(["en" , "ar"]).default("en")
        })
    })
 
export const signupSchema = loginSchema.extend({
firstName: z.string().regex(/^[a-zA-Z\u0621-\u064A]+$/),
lastName: z.string().regex(/^[a-zA-Z\u0621-\u064A]+$/),
gender: z.enum(["male", "female", "other"]).default("other"),
role: z.enum(["user", "admain"]).default("user"),
age:z.number().min(18 ,{error:"Age must be at least 18"}).max(100).optional(),
phoneNumber: z.string().regex(/^(002|\+2)?01[0125][0-9]{8}$/ ,{error:"please provide valid Egyptian Number"}).optional(),
confirmPassword : z.string()
}).refine((data)=>{
return data.password == data.confirmPassword

},
{
    message: "password and confirmPassword mismatch",
    path:["confirmPassword"]
})

   export const signup = z.object({
        body : signupSchema
    })


 export const resetPasswordSchema = z.strictObject({
  email: z.email({ error: "please provide valid email format" }),
  otp: z.string(),
  newPassword: loginSchema.shape.password
});

export const resetPassword = z.object({
  body: resetPasswordSchema
});