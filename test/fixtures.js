'use strict';

const streamBuffer = require('../lib/streambuffer');

const simpleString = 'This is a String!';
const simpleStringParts = ['This is ', 'a String!'];
const unicodeString = '\u00bd + \u00bc = \u00be';
const binaryData = new Buffer(64);
for(let i = 0; i < binaryData.length; i++) {
  binaryData[i] = i;
}

// Binary data larger than initial size of buffers.
const largeBinaryData = new Buffer(streamBuffer.DEFAULT_INITIAL_SIZE + 1);
for(let i = 0; i < largeBinaryData.length; i++) {
  largeBinaryData[i] = i % 256;
}

module.exports = {
  simpleString: simpleString,
  simpleStringParts: simpleStringParts,
  unicodeString: unicodeString,
  binaryData: binaryData,
  largeBinaryData: largeBinaryData
};
