/*
 * Create and exort configuration variables
 */

// Dependencies

const environments = {};

environments.staging = {
  httpPort: 3000,
  httpsPort: 3001,
  envName: 'staging',
};

environments.production = {
  httpPort: 3000,
  httpsPort: 3001,
  envName: 'production',
};

// Determin which environment was passed as a commant-line argument
const currentEnvironment = typeof process.env.NODE_ENV == 'string' ? process.env.NODE_ENV : '';

// Check that the current environment is one of the above or default to staging
const environmentToExport =
  typeof environments[currentEnvironment] == 'object' ? environments[currentEnvironment] : environments.staging;

module.exports = environmentToExport;
