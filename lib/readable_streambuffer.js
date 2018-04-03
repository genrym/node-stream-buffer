'use strict';

const stream = require('stream');
const constants = require('./constants');
const util = require('util');

const ReadableStreamBuffer = module.exports = function(opts) {
  const that = this;
  opts = opts || {};

  stream.Readable.call(this, opts);

  this.stopped = false;
  this.err = false;

  const frequency = opts.hasOwnProperty('frequency') ? opts.frequency : constants.DEFAULT_FREQUENCY;
  validateInteger(frequency, 'frequency');
  const chunkSize = opts.chunkSize || constants.DEFAULT_CHUNK_SIZE;
  validateInteger(chunkSize, 'chunkSize');
  const initialSize = opts.initialSize || constants.DEFAULT_INITIAL_SIZE;
  validateInteger(initialSize, 'initialSize');
  const incrementAmount = opts.incrementAmount || constants.DEFAULT_INCREMENT_AMOUNT;
  validateInteger(incrementAmount, 'incrementAmount');

  let size = 0;
  let buffer = new Buffer(initialSize);
  let allowPush = false;

  const sendData = function() {
    const amount = Math.min(chunkSize, size);
    let sendMore = false;

    if (amount > 0) {
      const chunk = new Buffer(amount);
      buffer.copy(chunk, 0, 0, amount);

      sendMore = that.push(chunk) !== false;
      allowPush = sendMore;

      buffer.copy(buffer, 0, amount, size);
      size -= amount;
    }

    if(size === 0 && that.stopped) {
      that.push(null);
    }

    if (sendMore) {
      sendData.timeout = setTimeout(sendData, frequency);
    }
    else {
      sendData.timeout = null;
    }

    if (that.err) {
      that.push([]);
    }
  };

  this.stop = function() {
    if (this.stopped) {
      throw new Error('stop() called on already stopped ReadableStreamBuffer');
    }
    this.stopped = true;

    if (size === 0) {
      this.push(null);
    }
  };

  this.error = function() {
    if (this.stopped) {
      throw new Error('error(err) called on already stopped ReadableStreamBuffer');
    }
    this.stopped = true;
    this.err = true;
  };

  this.size = function() {
    return size;
  };

  this.maxSize = function() {
    return buffer.length;
  };

  const increaseBufferIfNecessary = function(incomingDataSize) {
    if((buffer.length - size) < incomingDataSize) {
      const factor = Math.ceil((incomingDataSize - (buffer.length - size)) / incrementAmount);

      const newBuffer = new Buffer(buffer.length + (incrementAmount * factor));
      buffer.copy(newBuffer, 0, 0, size);
      buffer = newBuffer;
    }
  };

  const kickSendDataTask = function () {
    if (!sendData.timeout && allowPush) {
      sendData.timeout = setTimeout(sendData, frequency);
    }
  }

  this.put = function(data, encoding) {
    if (that.stopped) {
      throw new Error('Tried to write data to a stopped ReadableStreamBuffer');
    }

    if(Buffer.isBuffer(data)) {
      increaseBufferIfNecessary(data.length);
      data.copy(buffer, size, 0);
      size += data.length;
    }
    else {
      data = data + '';
      const dataSizeInBytes = Buffer.byteLength(data);
      increaseBufferIfNecessary(dataSizeInBytes);
      buffer.write(data, size, encoding || 'utf8');
      size += dataSizeInBytes;
    }

    kickSendDataTask();
  };

  this._read = function() {
    allowPush = true;
    kickSendDataTask();
  };

  function validateInteger(value, option) {
    if (!Number.isInteger(value)) {
      throw new TypeError('option \'' + option + '\' should be of type Integer');
    }
  }
};

util.inherits(ReadableStreamBuffer, stream.Readable);
