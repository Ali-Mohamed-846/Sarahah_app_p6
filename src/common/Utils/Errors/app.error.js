class HttpAppError extends Error{
    message ;
    statusCode;
    data;
    code ;
    constructor(
 message ,
    statusCode = 400,
    data = {},
    code = 'BAD_REQUEST' 

    ){
        super(message)
        this.message = message
        this.statusCode = statusCode
        this.code = code
        this.data = data
    }
}


export default HttpAppError;