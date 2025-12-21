class ApiError extends Error{
    constructor(
        statusCode,
        message = "error occur",
        errors=[],
        stack=""
    ) {
        super(message)
        this.statusCode = stack;
        this.message = message;
        this.success = false;
        this.errors=errors;
        if(!stack)   Error.captureStackTrace(this , this.constructor);
        else this.stack = stack

    }
}

export {ApiError}