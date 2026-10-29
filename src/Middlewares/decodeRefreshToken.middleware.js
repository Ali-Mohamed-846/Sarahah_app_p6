
import { BadRequestException} from "../common/utils/Errors/exception.error.js"
import { decodeToken } from "../common/utils/token.utils.js"
import { tokenTypeEnum } from "../common/constants.js"

export const decodeRefreshToken = async (req, res, next) => {

    const { refreshtoken } = req.headers
    if (!refreshtoken) {
        throw new BadRequestException("refresh token header is missing")
    }
    const [prefix, token] = refreshtoken.split(' ')
    if (prefix !== 'Bearer' || !token) {
        throw new BadRequestException('Invalid refreshtoken header format', null, 'UNAUTHORIZED')
    }
    const {tokenData} = await decodeToken({ token, tokentype :tokenTypeEnum.REFRESH_TOKEN})

  
    req.refreshTokenData =tokenData

    next()
}