const {ErrorResponseBuilder, SuccessResponseBuilder} = require('../libraries/response-builder');

module.exports = function(route, ...params) {
    return (req, res, next) => {
        params.forEach((param) => {
            if(typeof req.body[param] === 'undefined' || typeof req.body[param] === '' || typeof req.body[param] === null) {
                let error = new ErrorResponseBuilder(`Invalid request!!! ${param} is missing!!!`).errorType('DataValidationError').status(400).errorCode(route).build();
                return next(error);
            }
        });
        next();
    }
}

