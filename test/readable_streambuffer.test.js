'use strict';

const expect = require('chai').expect;
const fixtures = require('./fixtures');
const streamBuffer = require('../lib/streambuffer');

describe('A default ReadableStreamBuffer', function() {
  beforeEach(function() {
    this.buffer = new streamBuffer.ReadableStreamBuffer();
  });

  it('is a Stream', function() {
    expect(this.buffer).to.be.an.instanceOf(require('stream').Stream);
  });

  it('is empty by default', function() {
    expect(this.buffer.size()).to.equal(0);
  });

  it('has default backing buffer size', function() {
    expect(this.buffer.maxSize()).to.equal(streamBuffer.DEFAULT_INITIAL_SIZE);
  });

  describe('when stopped', function() {
    beforeEach(function() {
      this.buffer.stop();
    });

    it('throws error on calling stop() again', function() {
      expect(this.buffer.stop.bind(this.buffer)).to.throw(Error);
    });

    it('throws error on calls to put()', function() {
      expect(this.buffer.put.bind(this.buffer)).to.throw(Error);
    });
  });

  describe('when error', function() {
    beforeEach(function() {
      this.buffer.error();
    });

    it('throws error on calling error() again', function() {
      expect(this.buffer.error.bind(this.buffer)).to.throw(Error);
    });

    it('throws error on calls to put()', function() {
      expect(this.buffer.put.bind(this.buffer)).to.throw(Error);
    });

    it('emits error event', function(done) {
      this.buffer.on('error', function() {
        done();
      });
      this.buffer.read();
    });

  });

  it('emits end event when stopped', function(done) {
    this.buffer.on('end', done);
    this.buffer.stop();
    this.buffer.read();
  });

  it('emits end event after data, when stopped', function(done) {
    const that = this;
    let str = '';
    this.buffer.on('readable', function() {
      str += (that.buffer.read() || new Buffer(0)).toString('utf8');
    });
    this.buffer.on('end', function() {
      expect(str).to.equal(fixtures.unicodeString);
      done();
    });
    this.buffer.put(fixtures.unicodeString);
    this.buffer.stop();
  });

  it('pushes new data even if read when empty', function(done) {
    var that = this;
    var str = '';
    this.buffer.on('readable', function() {
      str += (that.buffer.read() || new Buffer(0)).toString('utf8');
    });
    this.buffer.on('end', function() {
      expect(str).to.equal(fixtures.unicodeString);
      done();
    });

    setTimeout(function() {
      that.buffer.put(fixtures.unicodeString);
      that.buffer.stop();
    }, streamBuffer.DEFAULT_FREQUENCY + 1);
  });

  describe('when writing binary data', function() {
    beforeEach(function(done) {
      const that = this;
      this.buffer.put(fixtures.binaryData);

      this.buffer.once('readable', function() {
        that.data = that.buffer.read();
        done();
      });
    });

    it('results in a Buffer', function() {
      expect(this.data).to.be.an.instanceOf(Buffer);
    });

    it('with the correct data', function() {
      expect(this.data).to.deep.equal(fixtures.binaryData);
    });
  });

  describe('when writing binary data larger than initial backing buffer size', function() {
    beforeEach(function() {
      this.buffer.pause();
      this.buffer.put(fixtures.largeBinaryData);
    });

    it('buffer is correct size', function() {
      expect(this.buffer.size()).to.equal(fixtures.largeBinaryData.length);
    });

    it('backing buffer is correct size', function() {
      expect(this.buffer.maxSize()).to.equal(streamBuffer.DEFAULT_INITIAL_SIZE + streamBuffer.DEFAULT_INCREMENT_AMOUNT);
    });
  });
});

describe('A ReadableStreamBuffer using custom chunk size', function() {
  beforeEach(function(done) {
    const that = this;

    this.buffer = new streamBuffer.ReadableStreamBuffer({
      chunkSize: 2
    });

    this.buffer.once('readable', function() {
      that.data = that.buffer.read();
      done();
    });
    this.buffer.put(fixtures.binaryData);
  });

  it('yields a Buffer with the correct data', function() {
    expect(this.data).to.deep.equal(fixtures.binaryData.slice(0, 2));
  });
});

describe('A ReadableStreamBuffer using custom frequency', function() {
  beforeEach(function(done) {
    const that = this;
    const startTime = new Date().getTime();

    this.buffer = new streamBuffer.ReadableStreamBuffer({
      frequency: 300
    });

    this.buffer.once('readable', function() {
      that.time = new Date().getTime() - startTime;
      done();
    });
    this.buffer.put(fixtures.binaryData);
  });

  it('gave us data after the correct amount of time', function() {
    // Wtfux: sometimes the timer is coming back a millisecond or two
    // faster. So we do a 'close-enough' assertion here ;)
    expect(this.time).to.be.at.least(295);
  });
});

describe('A ReadableStreamBuffer constructor', function() {

  it('should throw an Error when supplying non-integer value for chunkSize option', function() {
    const constrFloat = function() { new streamBuffer.ReadableStreamBuffer({chunkSize: 42.5}); };
    const constrString = function() { new streamBuffer.ReadableStreamBuffer({chunkSize: 'some'}); };
    const constrObject = function() { new streamBuffer.ReadableStreamBuffer({chunkSize: {}}); };
    const constrFunction = function() { new streamBuffer.ReadableStreamBuffer({chunkSize: function() {}}); };
    expect(constrFloat).to.throw(TypeError);
    expect(constrString).to.throw(TypeError);
    expect(constrObject).to.throw(TypeError);
    expect(constrFunction).to.throw(TypeError);
  });

  it('should throw an Error when supplying non-integer value for frequency option', function() {
    const constrFloat = function() { new streamBuffer.ReadableStreamBuffer({frequency: 42.5}); };
    const constrString = function() { new streamBuffer.ReadableStreamBuffer({frequency: 'some'}); };
    const constrObject = function() { new streamBuffer.ReadableStreamBuffer({frequency: {}}); };
    const constrFunction = function() { new streamBuffer.ReadableStreamBuffer({frequency: function() {}}); };
    expect(constrFloat).to.throw(TypeError);
    expect(constrString).to.throw(TypeError);
    expect(constrObject).to.throw(TypeError);
    expect(constrFunction).to.throw(TypeError);
  });

  it('should throw an Error when supplying non-integer value for initialSize option', function() {
    const constrFloat = function() { new streamBuffer.ReadableStreamBuffer({initialSize: 42.5}); };
    const constrString = function() { new streamBuffer.ReadableStreamBuffer({initialSize: 'some'}); };
    const constrObject = function() { new streamBuffer.ReadableStreamBuffer({initialSize: {}}); };
    const constrFunction = function() { new streamBuffer.ReadableStreamBuffer({initialSize: function() {}}); };
    expect(constrFloat).to.throw(TypeError);
    expect(constrString).to.throw(TypeError);
    expect(constrObject).to.throw(TypeError);
    expect(constrFunction).to.throw(TypeError);
  });

  it('should throw an Error when supplying non-integer value for incrementAmount option', function() {
    const constrFloat = function() { new streamBuffer.ReadableStreamBuffer({incrementAmount: 42.5}); };
    const constrString = function() { new streamBuffer.ReadableStreamBuffer({incrementAmount: 'some'}); };
    const constrObject = function() { new streamBuffer.ReadableStreamBuffer({incrementAmount: {}}); };
    const constrFunction = function() { new streamBuffer.ReadableStreamBuffer({incrementAmount: function() {}}); };
    expect(constrFloat).to.throw(TypeError);
    expect(constrString).to.throw(TypeError);
    expect(constrObject).to.throw(TypeError);
    expect(constrFunction).to.throw(TypeError);
  });

});
