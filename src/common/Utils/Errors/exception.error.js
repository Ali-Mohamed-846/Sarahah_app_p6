import HttpAppError from "./app.error.js"


export class BadRequestException extends HttpAppError {
    constructor(
        message = "bad request",
        data = {},
        code = "BAD_REQUEST"
    ) {
        super(message, 400, data, code)
    }
}


export class NotFoundException extends HttpAppError {
    constructor(
        message = "not found",
        data = {},
        code = "NOT_FOUND"
    ) {
        super(message, 404, data, code)
    }
}



export class ConflictException extends HttpAppError {
    constructor(
        message = "conflict",
        data = {},
        code = "CONFLICT"
    ) {
        super(message, 409, data, code)
    }
}





export class InternalServerErrorException extends HttpAppError {
    constructor(
        message = "internal server error",
        data = {},
        code = "INTERNAL_SERVER_ERROR"
    ) {
        super(message, 500, data, code)
    }
}



export class UNauthorizedException extends HttpAppError {
    constructor(
        message = "UNauthorizedException",
        data = {},
        code = "UNauthorizedException"
    ) {
        super(message, 401, data, code)
    }
}



