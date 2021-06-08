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
const handlers = require('./handlers');
const helpers = require('./helpers');

const server = {};

// Instantiate the http server
server.httpServer = http.createServer((req, res) => {
  server.unifiedServer(req, res);
});

// Instantiate the https sever
server.httpsServerOptions = {
  key: fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '/../https/cert.pem')),
};

server.httpsServer = https.createServer(server.httpsServerOptions, (req, res) => {
  server.unifiedServer(req, res);
});

// All the server logic (http/ https)
server.unifiedServer = (req, res) => {
  // Get the url and parse it
  const parsedURL = new URL(req.url, 'http://localhost:3000');

  // Get the path and trim it, get the query string as an object
  const { pathname, searchParams } = parsedURL;
  const trimmedPath = pathname.replace(/^\/+|\/+$/g, '');
  const queryStringObject = searchParams;

  // Get the method and headers
  const { method, headers } = req;

  // Decoder
  const decoder = new StringDecoder('utf-8');
  let buffer = '';
  req.on('data', data => {
    buffer += decoder.write(data);
  });

  req.on('end', () => {
    buffer += decoder.end();

    // Route the request to the handler specified
    const chosenHandler =
      typeof server.router[trimmedPath] !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;

    // Data object to send to the handler
    const data = {
      trimmedPath: trimmedPath,
      queryStringObject: queryStringObject,
      method: method.toLowerCase(),
      headers: headers,
      payload: helpers.parseJsonToObject(buffer),
    };

    chosenHandler(data, (statusCode, payload) => {
      statusCode = typeof statusCode == 'number' ? statusCode : 200;
      payload = typeof payload == 'object' ? payload : {};

      // Convert the payload to a string
      const payloadString = JSON.stringify(payload);

      // This is the response
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(statusCode);
      res.end(payloadString);
      console.log('This is the response:', statusCode, payloadString);
    });
  });
};

server.init = () => {
  // Start the http server and listen on port 3000

  server.httpServer.listen(config.httpPort, () => {
    console.log(`Server is listening on port ${config.httpPort}`);
  });

  server.httpsServer.listen(config.httpsPort, () => {
    console.log(`Server is listening on port ${config.httpsPort}`);
  });
};

// Router
server.router = {
  users: handlers.users,
  tokens: handlers.tokens,
  menu: handlers.menu,
};

module.exports = server;
