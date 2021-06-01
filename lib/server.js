/*
 * Sever-related
 */

// Dependencies
const http = require('http');
const https = require('https');
const { URL } = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const fs = require('fs');
const path = require('path');

// Instantiate the server model object
const server = {};

// Instantiate the HTTP server
server.httpServer = http.createServer((req, res) => {
  server.unifiedServer(req, res);
});

// Instantiate the HTTPS server
server.httpsServerOptions = {
  key: fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '/../https/cert.pem')),
};
server.httpsServer = https.createServer(server.httpsServerOptions, (req, res) => {
  server.unifiedServer(req, res);
});

// Server logic for http and https
server.unifiedServer = (req, res) => {
  // Get the url and parse it
  const parsedURL = new URL(req.url, 'http://localhaost:3000');

  // Get the path and trim it and the query string as an object
  const { pathname, searchParams } = parsedURL;
  const trimmedPath = pathname.replace(/^\/+|\/+$/g, '');
  const queryStringObject = searchParams;

  // Get the method and headers
  const { method, headers } = req;

  // Buffer
  const decoder = new StringDecoder('utf-8');
  let buffer = '';
  req.on('data', data => {
    buffer += decoder.write(data);
  });

  req.on('end', () => {
    buffer += decoder.end();

    // Route the request to the hadler specified
    const chosenHandler =
      typeof server.router[trimmedPath] !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;

    const data = {
      trimmedPath: trimmedPath,
      queryStringObject: queryStringObject,
      method: method.toLowerCase(),
      headers: headers,
      payload: buffer,
    };

    chosenHandler(data, (statusCode, payload) => {
      statusCode = typeof statusCode == 'number' ? statusCode : 300;
      payload = typeof payload == 'object' ? payload : {};

      // Convert payload to string
      const payloadString = JSON.stringify(payload);

      // This is the response
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(statusCode);
      res.end(payloadString);
      console.log(`This is the response: ${(statusCode, payloadString)}`);
    });
  });
};

// Define handlers
const handlers = {};

handlers.users = (data, callback) => {
  callback(200, {
    message: 'Pizza delivered',
  });
};

handlers.notFound = (data, callback) => {
  callback(404, { message: 'Route not found' });
};

// Create a router
server.router = {
  users: handlers.users,
};

// Init script
server.init = () => {
  // Start the HTTP server
  server.httpServer.listen(config.httpPort, () => {
    console.log(`The server is listening on port ${config.httpPort}`);
  });

  // Start the HTTPS server
  server.httpsServer.listen(config.httpsPort, () => {
    console.log(`The server is listening on port ${config.httpsPort}`);
  });
};

module.exports = server;
