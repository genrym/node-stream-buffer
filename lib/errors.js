'use strict';

class BufferOverflowError extends Error {
  constructor(message) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
    this.name = 'BufferOverflowError';
  }
}

module.exports = {
  BufferOverflowError: BufferOverflowError
};
