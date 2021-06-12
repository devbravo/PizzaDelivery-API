/*
 * Create and exort configuration variables
 */

// Dependencies
const dotenv = require('dotenv');
dotenv.config();

// Container
const environments = {};

const publishableKey = process.env.STRIPE_PUB_KEY;
const secretKey = process.env.STRIPE_SEC_KEY;
const mailgunKey = process.env.MAILGUN_AUTH_KEY;

environments.staging = {
  httpPort: 3000,
  httpsPort: 3001,
  envName: 'staging',
  hashingSecret: 'verySecretSecret',
  stripe: {
    publishableKey: publishableKey,
    secretKey: secretKey,
  },
  mailgunKey: mailgunKey,
};

environments.production = {
  httpPort: 3000,
  httpsPort: 3001,
  envName: 'production',
  hashingSecret: 'veryVerySecretSecret',
  stripe: {
    publishableKey: publishableKey,
    secretKey: secretKey,
  },
  mailgun: {
    mailgunKey: mailgunKey,
  },
};

// Determin which environment was passed as a commant-line argument
const currentEnvironment = typeof process.env.NODE_ENV == 'string' ? process.env.NODE_ENV : '';

// Check that the current environment is one of the above or default to staging
const environmentToExport =
  typeof environments[currentEnvironment] == 'object' ? environments[currentEnvironment] : environments.staging;

module.exports = environmentToExport;
