/*
 * Primary file for the API
 */

// Dependencies
const server = require('./lib/server');

// Declare app
const app = {};

// Init app
app.init = () => {
  // Start server
  server.init();
};

// Execute
app.init();

module.exports = app;
