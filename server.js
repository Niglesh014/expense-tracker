
const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 3000;

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript'
};

const server = http.createServer((req, res) => {
  let filePath = req.url === '/'
    ? path.join(__dirname, 'index.html')
    : path.join(__dirname, req.url);

  const ext = path.extname(filePath);

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found');
      return;
    }

    res.writeHead(200, {
      'Content-Type': mimeTypes[ext] || 'application/octet-stream'
    });

    res.end(content);
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});