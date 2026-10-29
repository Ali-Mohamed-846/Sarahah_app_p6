import UserRepository from "../DB/Repositories/user.repository.js"
import { BadRequestException, NotFoundException } from "../common/Utils/Errors/exception.error.js"
import { decodeToken } from "../common/Utils/token.utils.js"
import { tokenTypeEnum } from "../common/constants.js"
const userRepo = new UserRepository()
export const authenticate = async (req, res, next) => {

    const { authorization } = req.headers
    if (!authorization) {
        throw new BadRequestException("Authorization header is missing")
    }
    const [prefix, token] = authorization.split(' ')
    if (prefix !== 'Bearer' || !token) {
        throw new BadRequestException('Invalid authorization header format', null, 'UNAUTHORIZED')
    }
    const {user , tokenData} = await decodeToken({ token, tokentype :tokenTypeEnum.ACCESS_TOKEN})

    req.authUser = user
    req.accessTokenData =tokenData

    next()
}