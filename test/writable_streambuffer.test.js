'use strict';

const expect = require('chai').expect;
const fixtures = require('./fixtures');
const streamBuffer = require('../lib/streambuffer');
const stringStream = require('string-to-stream');
const BufferOverflowError = require('../lib/errors').BufferOverflowError;

describe('WritableStreamBuffer with defaults', function() {
  beforeEach(function() {
    this.buffer = new streamBuffer.WritableStreamBuffer();
  });

  it('returns empty Buffer on call to getContents() when empty', function() {
    const emptyBuffer = new Buffer('');
    return expect(this.buffer.getContents()).to.be.deep.equal(emptyBuffer);
  });

  it('returns empty string on call to getContentsAsString() when empty', function() {
    return expect(this.buffer.getContentsAsString()).to.be.equal('');
  });

  it('backing buffer should be default size', function() {
    expect(this.buffer.maxSize()).to.equal(streamBuffer.DEFAULT_INITIAL_SIZE);
  });

  describe('when writing a simple string', function() {
    beforeEach(function() {
      this.buffer.write(fixtures.simpleString);
    });

    it('should have a backing buffer of correct length', function() {
      expect(this.buffer.size()).to.equal(fixtures.simpleString.length);
    });

    it('should have a default max size', function() {
      expect(this.buffer.maxSize()).to.equal(streamBuffer.DEFAULT_INITIAL_SIZE);
    });

    it('contents should be correct', function() {
      expect(this.buffer.getContentsAsString()).to.equal(fixtures.simpleString);
    });

    it('returns partial contents correctly', function() {
      const buf = Buffer.concat([
        this.buffer.getContents(Math.floor(Buffer.byteLength(fixtures.simpleString) / 2)),
        this.buffer.getContents()
      ]);
      expect(buf.toString()).to.equal(fixtures.simpleString);
    });
  });

  describe('when writing a large binary blob', function() {
    beforeEach(function() {
      this.buffer.write(fixtures.largeBinaryData);
    });

    it('should have a backing buffer of correct length', function() {
      expect(this.buffer.size()).to.equal(fixtures.largeBinaryData.length);
    });

    it('should have a larger backing buffer max size', function() {
      expect(this.buffer.maxSize()).to.equal(streamBuffer.DEFAULT_INITIAL_SIZE + streamBuffer.DEFAULT_INCREMENT_AMOUNT);
    });

    it('contents are valid', function() {
      expect(this.buffer.getContents()).to.deep.equal(fixtures.largeBinaryData);
    });
  });

  describe('when writing some simple data to the stream', function() {
    beforeEach(function() {
      this.buffer = new streamBuffer.WritableStreamBuffer();
      this.buffer.write(fixtures.simpleString);
    });

    describe('and retrieving half of it', function() {
      beforeEach(function() {
        this.firstStr = this.buffer.getContentsAsString('utf8', Math.floor(fixtures.simpleString.length / 2));
      });

      it('returns correct data', function() {
        expect(this.firstStr).to.equal(fixtures.simpleString.substring(0, Math.floor(fixtures.simpleString.length / 2)));
      });

      it('leaves correct amount of data remaining in buffer', function() {
        expect(this.buffer.size()).to.equal(Math.ceil(fixtures.simpleString.length / 2));
      });

      describe('and then retrieving the other half of it', function() {
        beforeEach(function() {
          this.secondStr = this.buffer.getContentsAsString('utf8', Math.ceil(fixtures.simpleString.length / 2));
        });

        it('returns correct data', function() {
          expect(this.secondStr).to.equal(fixtures.simpleString.substring(Math.floor(fixtures.simpleString.length / 2)));
        });

        it('results in an empty buffer', function() {
          expect(this.buffer.size()).to.equal(0);
        });
      });
    });
  });
});

describe('WritableStreamBuffer with a different initial size and increment amount', function() {
  beforeEach(function() {
    this.buffer = new streamBuffer.WritableStreamBuffer({
      initialSize: 62,
      incrementAmount: 321
    });
  });

  it('has the correct initial size', function() {
    expect(this.buffer.maxSize()).to.equal(62);
  });

  describe('after data is written', function() {
    beforeEach(function() {
      this.buffer.write(fixtures.binaryData);
    });

    it('has correct initial size + custom increment amount', function() {
      expect(this.buffer.maxSize()).to.equal(321 + 62);
    });
  });
});

describe('WritableStreamBuffer with a different limit', function() {
  beforeEach(function() {
    this.limit = fixtures.simpleString.length - 1;
    this.buffer = new streamBuffer.WritableStreamBuffer({
      limit: this.limit
    });
  });

  it('should throw an Error after the limit number of bytes were written', function() {
    expect(this.buffer.write.bind(this.buffer, fixtures.simpleString)).to.throw(BufferOverflowError, 'Stream overflows the limit');
    expect(this.buffer.size()).to.equal(this.limit);
  });

  it('should throw an Error after the limit number of bytes were written in 2 chunks', function() {
    this.buffer.write(fixtures.simpleStringParts[0]);
    expect(this.buffer.write.bind(this.buffer, fixtures.simpleStringParts[1])).to.throw(BufferOverflowError, 'Stream overflows the limit');
    expect(this.buffer.size()).to.equal(this.limit);
  });

  it('should emit error event when the limit is surpassed', function(done) {
    this.buffer.on('error', function(err) {
      expect(err.name).to.be.equal(BufferOverflowError.name);
      done();
    });

    const overflowingReadableStream = givenOverflowingReadableStream();
    overflowingReadableStream.pipe(this.buffer);
  });

  function givenOverflowingReadableStream() {
    return stringStream(fixtures.simpleString);
  }
});

describe('When WritableStreamBuffer is written in two chunks', function() {
  beforeEach(function() {
    this.buffer = new streamBuffer.WritableStreamBuffer();
    this.buffer.write(fixtures.simpleString);
    this.buffer.write(fixtures.simpleString);
  });

  it('buffer contents are correct', function() {
    expect(this.buffer.getContentsAsString()).to.equal(fixtures.simpleString + fixtures.simpleString);
  });
});
