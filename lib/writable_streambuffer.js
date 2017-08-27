'use strict';

const util = require('util');
const stream = require('stream');
const constants = require('./constants');
const BufferOverflowError = require('./errors').BufferOverflowError;

const WritableStreamBuffer = module.exports = function(opts) {
  opts = opts || {};
  opts.decodeStrings = true;

  stream.Writable.call(this, opts);

  const initialSize = opts.initialSize || constants.DEFAULT_INITIAL_SIZE;
  const incrementAmount = opts.incrementAmount || constants.DEFAULT_INCREMENT_AMOUNT;
  const limit = opts.limit || constants.DEFAULT_LIMIT;

  let buffer = new Buffer(initialSize);
  let size = 0;

  this.size = function() {
    return size;
  };

  this.maxSize = function() {
    return buffer.length;
  };

  this.getContents = function(length) {
    if(!size) return new Buffer('');

    const data = new Buffer(Math.min(length || size, size));
    buffer.copy(data, 0, 0, data.length);

    if(data.length < size)
      buffer.copy(buffer, 0, data.length);

    size -= data.length;

    return data;
  };

  this.getContentsAsString = function(encoding, length) {
    if(!size) return '';

    const data = buffer.toString(encoding || 'utf8', 0, Math.min(length || size, size));
    const dataLength = Buffer.byteLength(data);

    if(dataLength < size)
      buffer.copy(buffer, 0, dataLength);

    size -= dataLength;
    return data;
  };

  const increaseBufferIfNecessary = function(incomingDataSize) {
    if((buffer.length - size) < incomingDataSize) {
      const factor = Math.ceil((incomingDataSize - (buffer.length - size)) / incrementAmount);

      const newBuffer = new Buffer(buffer.length + (incrementAmount * factor));
      buffer.copy(newBuffer, 0, 0, size);
      buffer = newBuffer;
    }
  };

  function allowedToWriteSize(chunkSize) {
    return Math.min(chunkSize, limit - size);
  }

  this._write = function(chunk, encoding, callback) {
    const sizeToWrite = allowedToWriteSize(chunk.length);
    increaseBufferIfNecessary(sizeToWrite);
    chunk.copy(buffer, size, 0, sizeToWrite);
    size += sizeToWrite;
    if (sizeToWrite < chunk.length) {
      callback(new BufferOverflowError('Stream overflows the limit'));
    } else {
      callback();
    }
  };
};

util.inherits(WritableStreamBuffer, stream.Writable);
