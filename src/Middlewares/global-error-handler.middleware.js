
export const globalErrorHandler = (err, req, res, next) => {
    console.error(Object.keys(err), err);

    res.status(err.statusCode || 500).json({
        message: err.message || "Internal Server Error",
        errorBody:err.data,
        code : err.code
    });
};
