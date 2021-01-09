'use strict';

const fs = require('fs');
const path = require('path');

const fileExists = (arr, dir) => arr.indexOf(dir) !== -1;

function sendStaticFile(res, source, contentType = '') {
  const pathToFile = path.resolve(__dirname, `../static${source}`);
  fs.readFile(
    pathToFile,
    (err, file) => {
      if (err) {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Not found' }));
      }
      else{
        res.setHeader('Content-Type', contentType);
        res.end(file);
      }
    }
  );
}

module.exports = { fileExists, sendStaticFile };
