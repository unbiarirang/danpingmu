"use strict"

class BaseError extends Error {
    constructor(code, message, status) {
        super();
        Error.captureStackTrace(this, this.constructor);

        this.name = this.constructor.name;
        this.code = code;
        this.message = message || 'Something went wrong. Please try again.';
        this.status = status || 500;
    }
}

class NotExistError extends BaseError {
    constructor(message) {
        super(1, message || 'Data not exist.', 404);
    }
}
exports.NotExistError = NotExistError;

class DuplicatedError extends BaseError {
    constructor(message) {
        super(2, message || 'Data duplicated.', 500);
    }
}
exports.DuplicatedError = DuplicatedError;
