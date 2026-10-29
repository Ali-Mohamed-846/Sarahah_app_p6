import jwt from "jsonwebtoken"
import { BadRequestException, NotFoundException, UNauthorizedException } from "./Errors/exception.error.js"
import UserRepository from "../../DB/Repositories/user.repository.js"
import { tokenTypeEnum } from "../constants.js"
import envConfig from "../../../config/config.js"
import { get } from "../Services/redis.services.js"

const userRepo = new UserRepository()

export const generateToken = (payload, secret, options) => {
    return jwt.sign(payload, secret, options)
}
export const verifyToken = (token, secret) => {
    return jwt.verify(token, secret,)
}

export const decodeToken = async ({token, tokentype}) => {
    const data = jwt.decode(token)
    if (!data.role) {
        throw new BadRequestException('Role not found in token', null, 'MISSING_ROLE')
    }

  const signature = getSignuatureByRoleAndType({role:data.role ,tokentype  })

    const decodedData = verifyToken(token, signature)

const isTokenBlackListed = await get(`bl_${tokentype}_${decodedData.jti}`);

if (isTokenBlackListed) {
  throw new UNauthorizedException( 'This token is revoked try to re-login', null, 'UNAUTHORIZED' );
}

    const user = await userRepo.findDocumentById(decodedData._id)
    if (!user) {
        throw new NotFoundException("no user found")
    }

    return{user , tokenData:decodedData}
}

const getSignuatureByRoleAndType= ({role ,tokentype})=>{
      let signature
      console.log('tokentype:', tokentype)
console.log('ACCESS_TOKEN:', tokenTypeEnum.ACCESS_TOKEN)
console.log('REFRESH_TOKEN:', tokenTypeEnum.REFRESH_TOKEN)
    switch (tokentype) {
        case tokenTypeEnum.ACCESS_TOKEN:
            signature = envConfig.jwt[role].access_token_secret
            break
        case tokenTypeEnum.REFRESH_TOKEN:
            signature =envConfig.jwt[role].refresh_token_secret
            break
        default:
            throw new BadRequestException('Invalid token type', null, 'INVALID_TOKEN_TYPE')
    }
return signature
  }