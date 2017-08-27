Note: this repository was forked from the original, since the original seemed to be unreachable for pull requests.

Note2: the library uses some ES6 features

# Node Stream Buffers

[![Build Status][badge-travis-img]][badge-travis-url]
[![Code Climate][badge-climate-img]][badge-climate-url]
[![Code Coverage][badge-coverage-img]][badge-coverage-url]
[![npm][badge-npm-img]][badge-npm-url]

Simple Readable and Writable Streams that use a [Buffer][node-buffer-docs] to store received data, or for data to send out. Useful for test code, debugging, and a wide range of other utilities.

```
npm install streamable-buffers --save
```

## Usage

To use the stream buffers in your module, simply import it and away you go.

```js
var streamBuffers = require('streamable-buffers');
```

### WritableStreamBuffer

`WritableStreamBuffer` implements the standard [`stream.Writable`](https://nodejs.org/api/stream.html#stream_class_stream_writable) interface. All writes to this stream will accumulate in an internal [`Buffer`](https://nodejs.org/api/buffer.html). If the internal buffer overflows it will be resized automatically. The initial size of the Buffer and the amount in which it grows can be configured in the constructor.

There is also a possibility to limit the maximum amount of bytes to be written to the buffer, by specifying the _limit_ option. If the limit is reached - an _Error_ will be thrown, and 'error' event will be emitted.

```js
var myWritableStreamBuffer = new streamBuffers.WritableStreamBuffer({
	initialSize: (100 * 1024),    // start at 100 kilobytes.
	incrementAmount: (10 * 1024), // grow by 10 kilobytes each time buffer overflows.
	limit: (1024 * 1024)          // maximum buffer size to write is 1 megabyte
});
```

The default initial size and increment amount are stored in the following constants:

```js
streamBuffers.DEFAULT_INITIAL_SIZE      // (8 * 1024)
streamBuffers.DEFAULT_INCREMENT_AMOUNT  // (8 * 1024)
streamBuffers.DEFAULT_LIMIT             // (64 * 1024)
```

Writing is standard Stream stuff:

```js
myWritableStreamBuffer.write(myBuffer);
// - or -
myWritableStreamBuffer.write('\u00bd + \u00bc = \u00be', 'utf8');
```

You can query the size of the data being held in the Buffer, and also how big the Buffer's max capacity currently is: 

```js
myWritableStreamBuffer.write('ASDF');
streamBuffers.size();     // 4.
streamBuffers.maxSize();  // Whatever was configured as initial size. In our example: (100 * 1024).
```

Retrieving the contents of the Buffer is simple.

```js
// Gets all held data as a Buffer.
myWritableStreamBuffer.getContents();

// Gets all held data as a utf8 string.
myWritableStreamBuffer.getContentsAsString('utf8');

// Gets first 5 bytes as a Buffer.
myWritableStreamBuffer.getContents(5);

// Gets first 5 bytes as a utf8 string.
myWritableStreamBuffer.getContentsAsString('utf8', 5);
```

**Care should be taken when getting encoded strings from WritableStream, as it doesn't really care about the contents (multi-byte characters will not be respected).**

Destroying or ending the WritableStream will not delete the contents of Buffer, but will disallow any further writes.

```js
myWritableStreamBuffer.write('ASDF');
myWritableStreamBuffer.end();
myWritableStreamBuffer.getContentsAsString(); // -> 'ASDF'
```	

### ReadableStreamBuffer

`ReadableStreamBuffer` implements the standard [`stream.Readable`](https://nodejs.org/api/stream.html#stream_class_stream_readable), but can have data inserted into it. This data will then be pumped out in chunks as readable events. The data to be sent out is held in a Buffer, which can grow in much the same way as a `WritableStreamBuffer` does, if data is being put in Buffer faster than it is being pumped out. 

The frequency in which chunks are pumped out, and the size of the chunks themselves can be configured in the constructor. The initial size and increment amount of internal Buffer can be configured too. In the following example 2kb chunks will be output every 10 milliseconds:

```js
var myReadableStreamBuffer = new streamBuffers.ReadableStreamBuffer({
	frequency: 10,   // in milliseconds.
	chunkSize: 2048  // in bytes.
});
```

Default frequency and chunk size:

```js
streamBuffers.DEFAULT_CHUNK_SIZE  // (1024)
streamBuffers.DEFAULT_FREQUENCY   // (1)
```

Putting data in Buffer to be pumped out is easy:

```js
myReadableStreamBuffer.put(aBuffer);
myReadableStreamBuffer.put('A String', 'utf8');
```

Chunks are pumped out via standard `stream.Readable` semantics. This means you can use the old streams1 way:

```js
myReadableStreamBuffer.on('data', function(data) {
  // streams1.x style data
  assert.isTrue(data instanceof Buffer);
});
```

Or the streams2+ way:

```js
myReadableStreamBuffer.on('readable', function(data) {
  var chunk;
  while((chunk = myReadableStreamBuffer.read()) !== null) {
    assert.isTrue(chunk instanceof Buffer);
  }
});
```

Because `ReadableStreamBuffer` is simply an implementation of [`stream.Readable`](https://nodejs.org/api/stream.html#stream_class_stream_readable), it implements pause / resume / setEncoding / etc.

Once you're done putting data into a `ReadableStreamBuffer`, you can call `stop()` on it.

```js
myReadableStreamBuffer.put('the last data this stream will ever see');
myReadableStreamBuffer.stop();
```

Once the `ReadableStreamBuffer` is done pumping out the data in its internal buffer, it will emit the usual [`end`](https://nodejs.org/api/stream.html#stream_event_end) event. You cannot write any more data to the stream once you've called `stop()` on it.

It is possible to simulate 'error' Event:

```js
myReadableStreamBuffer.on('error', function(err) {
  ...
});
myReadableStreamBuffer.put('Send some data', 'utf-8')
myReadableStreamBuffer.error();  // interrupt with simulating invalid chunk
```
You cannot write any more data to the stream once you've called error() on it.


## License

node-stream-buffer is free and unencumbered public domain software. For more information, see the accompanying UNLICENSE file.

[badge-travis-img]: https://img.shields.io/travis/genrym/streamable-buffers.svg?style=flat-square
[badge-travis-url]: https://travis-ci.org/genrym/streamable-buffers
[badge-climate-img]: https://img.shields.io/codeclimate/github/genrym/streamable-buffers.svg?style=flat-square
[badge-climate-url]: https://codeclimate.com/github/genrym/streamable-buffers
[badge-coverage-img]: https://img.shields.io/codeclimate/coverage/github/genrym/streamable-buffers.svg?style=flat-square
[badge-coverage-url]: https://codeclimate.com/github/genrym/streamable-buffers
[badge-npm-img]: https://img.shields.io/npm/dm/streamable-buffers.svg?style=flat-square
[badge-npm-url]: https://www.npmjs.org/package/streamable-buffers

[node-buffer-docs]: http://nodejs.org/api/buffer.html
