/*
 * Request handlers
 */

// Dependencies
const { type } = require('os');
const _data = require('./data');
const helpers = require('./helpers');

// Define all the handlers
const handlers = {};

// Not found handler
handlers.notFound = (data, callback) => {
  callback(404, { msg: 'not found' });
};

/* ============================= */
// Users
handlers.users = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  }
};

const emailRegEx = /\S+@\S+\.\S+/;

// Container for all the user methods
handlers._users = {};

// Users - post
// Require data : firstName, lastName, email, password, street address
// Optional data: none
handlers._users.post = async (data, callback) => {
  // Check that all required fileds are filled out
  const firstName =
    typeof data.payload.firstName == 'string' && data.payload.firstName.trim().length > 0
      ? data.payload.firstName.trim()
      : false;

  const lastName =
    typeof data.payload.lastName == 'string' && data.payload.lastName.trim().length > 0
      ? data.payload.lastName.trim()
      : false;

  const email =
    typeof data.payload.email == 'string' && emailRegEx.test(data.payload.email) ? data.payload.email : false;

  const password =
    typeof data.payload.password == 'string' && data.payload.password.trim().length > 10
      ? data.payload.password.trim()
      : false;

  const address =
    typeof data.payload.address == 'string' && data.payload.address.trim().length > 0
      ? data.payload.address.trim()
      : false;

  if (firstName && lastName && email && password && address) {
    // Make sure the user doesn't already exist
    const tokenData = await _data.read('users', email);

    if (typeof tokenData == 'undefined') {
      // Hash the password
      const hashedPassword = helpers.hash(password);
      // Create the user object
      if (hashedPassword) {
        const userObject = {
          firstName: firstName,
          lastName: lastName,
          email: email,
          hashedPassword: hashedPassword,
          address: address,
        };

        // Store the user
        const createData = await _data.create('users', email, userObject);
        if (typeof createData == 'undefined') {
          callback(200);
        } else {
          callback(500, { Error: 'Could not create the new user.' });
        }
      } else {
        callback(500, { Error: "Could not hash the user's password." });
      }
    } else {
      callback(400, { Error: 'A  user with that email address already exist.' });
    }
  } else {
    callback(400, { Error: 'Missing required fields.' });
  }
};

// Users - get
// Required data: email
// Optional data: none
handlers._users.get = async (data, callback) => {
  const email =
    typeof data.queryStringObject.get('email') == 'string' && emailRegEx.test(data.queryStringObject.get('email'))
      ? data.queryStringObject.get('email')
      : false;

  if (email) {
    const readData = await _data.read('users', email);
    if (readData) {
      // Remove hashed password from object
      delete readData.hashedPassword;
      callback(200, readData);
    } else {
      callback(404);
    }
  } else {
    callback(400, { Error: 'Missing required field' });
  }
};

// Users - put
// Required data: email
// Optional data: firstName, lastName, password, address (at least one must be specified)
handlers._users.put = async (data, callback) => {
  // Check if the user's email is valid
  const email =
    typeof data.payload.email == 'string' && emailRegEx.test(data.payload.email) ? data.payload.email : false;

  // Optional fields
  const firstName =
    typeof data.payload.firstName == 'string' && data.payload.firstName.trim().length > 0
      ? data.payload.firstName.trim()
      : false;

  const lastName =
    typeof data.payload.lastName == 'string' && data.payload.lastName.trim().length > 0
      ? data.payload.lastName.trim()
      : false;

  const password =
    typeof data.payload.password == 'string' && data.payload.password.trim().length > 10
      ? data.payload.password.trim()
      : false;

  const address =
    typeof data.payload.address == 'string' && data.payload.address.trim().length > 0
      ? data.payload.address.trim()
      : false;

  // Error if email is invalid
  if (email) {
    // Error if noting is send to updata
    if (firstName || lastName || password || address) {
      // Lookup user
      const readData = await _data.read('users', email);
      if (readData) {
        // Update the fields
        if (firstName) {
          readData.firstName = firstName;
        }
        if (lastName) {
          readData.lastName = lastName;
        }
        if (password) {
          readData.password = password;
        }
        if (address) {
          readData.address = address;
        }
        // Store the updates
        const updatedData = await _data.update('users', email, readData);
        if (!updatedData) {
          callback(200);
        } else {
          callback(500, { Error: 'Could not update the user' });
        }
      } else {
        callback(400, { Error: 'The specified user doesn not exist.' });
      }
    } else {
      callback(400, { Error: 'Missing fields to updata' });
    }
  } else {
    callback(400, { Error: 'Missing required field' });
  }
};

// Users - delete
// Required field : email
// Optional : none
handlers._users.delete = async (data, callback) => {
  // Check if the email number is valid
  const email =
    typeof data.queryStringObject.get('email') == 'string' && emailRegEx.test(data.queryStringObject.get('email'))
      ? data.queryStringObject.get('email')
      : false;

  if (email) {
    // Lookup the user
    const userData = await _data.read('users', email);
    if (userData) {
      const deletedData = await _data.delete('users', email);
      if (typeof deletedData == 'undefined') {
        callback(200, { Success: 'User deleted' });
      } else {
        callback(500, { Error: 'Could not delete the specified user.' });
      }
    } else {
      callback(400, { Error: 'Could not find the specified user.' });
    }
  } else {
    callback(400, { Error: 'Missing required field.' });
  }
};
/*=================================*/
// Tokens

module.exports = handlers;
