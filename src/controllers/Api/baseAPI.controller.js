exports.successResponse = (res, data, message, statusCode = 200) => {
    const response = {
        status: 'success',
        data: data,
        message: message,
    };
    return res.status(statusCode).json(response);
};

exports.errorResponse = (res, message, statusCode = 400) => {
    const response = {
        status: 'error',
        message: message,
    };
    return res.status(statusCode).json(response);
};
