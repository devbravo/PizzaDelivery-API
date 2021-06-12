/*
 * Request handlers
 */

// Dependencies
const _data = require('./data');
const helpers = require('./helpers');
const menuItems = require('../.data/menu/menu');

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

  if ((firstName && lastName && email && password && address) === false) {
    return callback(400, { Error: 'Missing required fields.' });
  }
  // Make sure the user doesn't already exist
  const userData = await _data.read('users', email);

  if (typeof userData != 'undefined') {
    return callback(400, { Error: 'A user with that email address already exist.' });
  }
  // Hash the password
  const hashedPassword = helpers.hash(password);
  // Create the user object
  if (!hashedPassword) {
    return callback(500, { Error: "Could not hash the user's password." });
  }
  const userObject = {
    firstName: firstName,
    lastName: lastName,
    email: email,
    hashedPassword: hashedPassword,
    address: address,
  };

  // Store the user
  const createData = await _data.create('users', email, userObject);
  if (typeof createData != 'undefined') {
    return callback(500, { Error: 'Could not create the new user.' });
  }
  callback(200, { Success: `User ${email} was succesfully created.` });
};

// Users - get
// Required data: email
// Optional data: none
handlers._users.get = async (data, callback) => {
  // Check if the email is valid
  const email =
    typeof data.queryStringObject.get('email') == 'string' && emailRegEx.test(data.queryStringObject.get('email'))
      ? data.queryStringObject.get('email')
      : false;

  // Check if the user exists
  const readData = await _data.read('users', email);

  if (email && readData) {
    // Get the token from the headers
    const token = typeof data.headers.token === 'string' ? data.headers.token : false;
    // Verify that the given token is valid for email
    const tokenIsValid = await handlers._tokens.verifyToken(token, email);
    if (tokenIsValid) {
      // Remove hashed password from object
      delete readData.hashedPassword;
      callback(200, readData);
    } else {
      callback(403, { Error: 'Missing required token in header, or token is invalid.' });
    }
  } else {
    callback(400, { Error: "Missing required field or the specified user doesn't exist." });
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

  // Error if email is invalid or if email entered is not the same as email registered
  const readData = await _data.read('users', email);

  if (email && readData) {
    // Error if nothing is send to update
    if (firstName || lastName || password || address) {
      // Verify that the given token is valid for the email
      const token = typeof data.headers.token == 'string' ? data.headers.token : false;
      const tokenIsValid = await handlers._tokens.verifyToken(token, email);
      if (tokenIsValid) {
        // Update the fields
        if (firstName) {
          readData.firstName = firstName;
        }
        if (lastName) {
          readData.lastName = lastName;
        }
        if (password) {
          readData.hashedPassword = helpers.hash(password);
        }
        if (address) {
          readData.address = address;
        }
        // Store the updates
        const updatedData = await _data.update('users', email, readData);
        if (!updatedData) {
          callback(200, { Success: `User ${email} was successfully updated.` });
        } else {
          callback(500, { Error: 'Could not update the user.' });
        }
      } else {
        callback(403, { Error: 'Missing required token in header, or token is invalid.' });
      }
    } else {
      callback(400, { Error: 'Missing fields to update' });
    }
  } else {
    callback(400, { Error: "Missing required field or the specified user doesn't exist." });
  }
};

// Users - delete
// Required field : email
// Optional : none
handlers._users.delete = async (data, callback) => {
  // Check if the email is valid
  const email =
    typeof data.queryStringObject.get('email') == 'string' && emailRegEx.test(data.queryStringObject.get('email'))
      ? data.queryStringObject.get('email')
      : false;

  // Lookup the user
  const userData = await _data.read('users', email);
  // Check if the email entered is correct and that the user exist.
  if (email && userData) {
    const token = typeof data.headers.token == 'string' ? data.headers.token : false;
    // Verify that the given token is valid for the email
    const tokenIsValid = await handlers._tokens.verifyToken(token, email);
    if (tokenIsValid) {
      const deletedData = await _data.delete('users', email);
      if (typeof deletedData == 'undefined') {
        callback(200, { Success: `User ${email} was successfully deleted.` });
      } else {
        callback(500, { Error: 'Could not delete the specified user.' });
      }
    } else {
      callback(403, { Error: 'Missing required token in header, or token is invalid.' });
    }
  } else {
    callback(400, { Error: "Missing required field (email) or the specified user doesn't exist." });
  }
};
/*=================================*/
// Tokens
handlers.tokens = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for the tokens
handlers._tokens = {};

// Token - post
// Required data : email, password
// Optional data: none
handlers._tokens.post = async (data, callback) => {
  const email =
    typeof data.payload.email == 'string' && emailRegEx.test(data.payload.email) ? data.payload.email : false;

  const password =
    typeof data.payload.password == 'string' && data.payload.password.trim().length > 10
      ? data.payload.password.trim()
      : false;

  if (email && password) {
    // Look up the user
    const readData = await _data.read('users', email);
    if (readData) {
      // Has the sent password, and compare it to the password stored
      const hashedPassword = helpers.hash(password);
      if (hashedPassword == readData.hashedPassword) {
        // If valid, create a token with a random name. Set expiration data to 1 hour into the future
        const tokenId = helpers.createRandomString(20);
        const expires = Date.now() + 1000 * 60 * 60;
        const tokenObject = {
          email: email,
          id: tokenId,
          expires: expires,
        };
        // Store the token
        const storeToken = await _data.create('tokens', tokenId, tokenObject);
        if (typeof storeToken == 'undefined') {
          callback(200, tokenObject);
        } else {
          callback(500, { Error: 'Could not create the new token' });
        }
      } else {
        callback(400, { Error: "Password did not match the specified user's stored password" });
      }
    } else {
      callback(400, { Error: 'Could not find the specified user.' });
    }
  } else {
    callback(400, { Error: 'Missing required fields.' });
  }
};

// Token - get
// Required data: id
// Optional data : none
handlers._tokens.get = async (data, callback) => {
  const id =
    typeof data.queryStringObject.get('id') === 'string' && data.queryStringObject.get('id').trim().length == 20
      ? data.queryStringObject.get('id').trim()
      : false;

  if (id) {
    // Lookup token
    const tokenData = await _data.read('tokens', id);
    if (tokenData) {
      callback(200, tokenData);
    } else {
      callback(404, { Error: 'No token found' });
    }
  } else {
    callback(400, { Error: 'Missing required field.' });
  }
};

// Token - put
// Required data: id, extend
// Optional data :none
handlers._tokens.put = async (data, callback) => {
  const id = typeof data.payload.id == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
  const extend = typeof data.payload.extend == 'boolean' && data.payload.extend == true ? true : false;

  if (id && extend) {
    // Look up token
    const tokenData = await _data.read('tokens', id);
    if (tokenData) {
      // check if the token isn't already expired
      if (tokenData.expires > Date.now()) {
        // Set expiration an hour from now
        tokenData.expires = Date.now() + 1000 * 60 * 60;
        // Store the new update
        const updatedTokenExpDate = await _data.update('tokens', id, tokenData);

        if (typeof updatedTokenExpDate === 'undefined') {
          callback(200, { Success: 'Token expiration date successfully extended.' });
        } else {
          callback(500, { Error: 'Could not update the tokens expiration date.' });
        }
      } else {
        callback(400, { Error: 'The token has already expired and cannot be extended.' });
      }
    } else {
      callback(400, { Error: 'Specified token does not exist.' });
    }
  } else {
    callback(400, { Error: 'Missing required field(s) or field(s) are invalid.' });
  }
};

// Token - delete
// Required data: id,
// Optional data: none
handlers._tokens.delete = async (data, callback) => {
  const id =
    typeof data.queryStringObject.get('id') == 'string' && data.queryStringObject.get('id').trim().length == 20
      ? data.queryStringObject.get('id').trim()
      : false;

  if (id) {
    // Look up the token
    const tokenData = await _data.read('tokens', id);
    if (tokenData) {
      const deleteToken = await _data.delete('tokens', id);
      if (typeof deleteToken == 'undefined') {
        callback(200, { Success: 'Token was successfully deleted.' });
      } else {
        callback(500, {
          Error: "Couldn't delete the specified token.",
        });
      }
    } else {
      callback(400, { Error: "Can't find the specified token." });
    }
  } else {
    callback(400, { Error: 'Missing required fields.' });
  }
};

// Verify if a token id is currently valid for a given user
handlers._tokens.verifyToken = async (id, email) => {
  const tokenData = await _data.read('tokens', id);

  if (tokenData) {
    if (tokenData.email == email && tokenData.expires > Date.now()) {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
};

/* ======================================= */
// Menu

// Container for the menu

handlers.menu = (data, callback) => {
  const acceptableMethods = ['get'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._menu[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for menu handlers
handlers._menu = {};

// Menu - get
// Required data: email, valid token
// Optional data:
handlers._menu.get = async (data, callback) => {
  const email =
    typeof data.payload.email == 'string' && emailRegEx.test(data.payload.email) ? data.payload.email : false;

  if (email) {
    // Get token from the header
    const token = typeof data.headers.token == 'string' ? data.headers.token : false;
    // Check if the token isn't expired and still valid
    const tokenIsValid = await handlers._tokens.verifyToken(token, email);
    if (tokenIsValid) {
      callback(200, menuItems);
    } else {
      callback(403, { Error: 'Missing required token in header, or token is invalid.' });
    }
  } else {
    callback(400, { Error: 'Missing required field.' });
  }
};

/* ===================================================== */
// Shopping cart

handlers.shoppingCart = (data, callback) => {
  const acceptableMethods = ['post', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._shoppingCart[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for shopping cart handlers
handlers._shoppingCart = {};

// shoppingCart - post
// Required data: id, (flavorId, crustId) => numbers
// Optional data: toppingsMeatsIds, toppingsVegetablesIds => Array of numbers

handlers._shoppingCart.post = async (data, callback) => {
  // Required data
  const email =
    typeof data.payload.email == 'string' && emailRegEx.test(data.payload.email) ? data.payload.email : false;

  const flavorId =
    typeof data.payload.flavorId == 'number' && data.payload.flavorId <= 6 ? data.payload.flavorId : false;

  const crustId = typeof data.payload.crustId == 'number' && data.payload.crustId <= 6 ? data.payload.crustId : false;

  // Optional data
  const toppingsMeatsIds =
    typeof data.payload.toppingsMeatsIds == 'number' &&
    data.payload.toppingsMeatsIds > 0 &&
    data.payload.toppingsMeatsIds <= 4
      ? data.payload.toppingsMeatsIds
      : false;

  const toppingsVegetablesIds =
    typeof data.payload.toppingsVegetablesIds &&
    data.payload.toppingsVegetablesIds > 0 &&
    data.payload.toppingsVegetablesIds <= 2
      ? data.payload.toppingsVegetablesIds
      : false;

  if (typeof flavorId == 'number' && typeof crustId == 'number') {
    // Check if the user is logged in
    const token = typeof data.headers.token == 'string' ? data.headers.token : false;
    // Verify that the given token is valid for the email
    const tokenIsValid = await handlers._tokens.verifyToken(token, email);

    if (tokenIsValid) {
      // Check if cart item already exist
      const cartData = await _data.read('cart', email);
      if (!cartData) {
        // Create the cart object
        const cart = await helpers.compareAndAddItems(flavorId, crustId, toppingsMeatsIds, toppingsVegetablesIds);
        // Store the data object
        const cartObject = await _data.create('cart', email, cart);

        if (typeof cartObject == 'undefined') {
          callback(200, cart);
        } else {
          callback(500, { Error: "Can't add items to cart" });
        }
      } else {
        callback(400, { Error: 'You already have a cart filled with items.' });
      }
    } else {
      callback(400, { Error: 'Missing required token in header or token is invalid.' });
    }
  } else {
    callback(400, { Error: 'Missing required fields' });
  }
};

// shoppingCart - put
// Required data: email, item to update (pizza, crust, meatTopping, vegetableTopping)
// Optional data:
handlers._shoppingCart.put = async (data, callback) => {
  const email =
    typeof data.payload.email == 'string' && emailRegEx.test(data.payload.email) ? data.payload.email : false;

  const flavorId =
    typeof data.payload.flavorId == 'number' && data.payload.flavorId <= 6 ? data.payload.flavorId : false;

  const crustId = typeof data.payload.crustId == 'number' && data.payload.crustId <= 6 ? data.payload.crustId : false;

  // Optional data
  const toppingsMeatsIds =
    typeof data.payload.toppingsMeatsIds == 'number' &&
    data.payload.toppingsMeatsIds > 0 &&
    data.payload.toppingsMeatsIds <= 4
      ? data.payload.toppingsMeatsIds
      : false;

  const toppingsVegetablesIds =
    typeof data.payload.toppingsVegetablesIds &&
    data.payload.toppingsVegetablesIds > 0 &&
    data.payload.toppingsVegetablesIds <= 2
      ? data.payload.toppingsVegetablesIds
      : false;

  if (flavorId || crustId || toppingsMeatsIds || toppingsVegetablesIds) {
    // Check if the user is logged in
    const token = typeof data.headers.token == 'string' ? data.headers.token : false;
    // Verify that the given token is valid for the email
    const tokenIsValid = await handlers._tokens.verifyToken(token, email);

    if (tokenIsValid) {
      // Check if the shopping cart exist
      const cartData = await _data.read('cart', email);
      if (cartData) {
        // Create the cart object
        const cart = await helpers.compareAndAddItems(flavorId, crustId, toppingsMeatsIds, toppingsVegetablesIds);
        // Update the current cart
        const updateCart = await _data.update('cart', email, cart);
        if (typeof updateCart == 'undefined') {
          callback(200, cart);
        } else {
          callback(500, { Error: "Cart couldn't be updated." });
        }
      } else {
        callback(400, {});
      }
    } else {
      callback(400, { Error: 'Missing required token in header or token is invalid.' });
    }
  } else {
    callback(400, { Error: 'Missing required fields.' });
  }
};

// shoppingCart - delete
// Required data: shoppingCart object
// Optional data: none

handlers._shoppingCart.delete = async (data, callback) => {
  const email =
    typeof data.queryStringObject.get('cart') == 'string' && emailRegEx.test(data.queryStringObject.get('cart'))
      ? data.queryStringObject.get('cart')
      : false;

  if (email) {
    // Check if token exist and is valid
    const token = typeof data.headers.token == 'string' ? data.headers.token : false;

    const tokenIsValid = await handlers._tokens.verifyToken(token, email);
    if (tokenIsValid) {
      // Check if the shopping cart exist
      const cartData = await _data.read('cart', email);
      if (cartData) {
        // Delete the items in the cart
        const cartItemsDel = await _data.delete('cart', email);
        if (typeof cartItemsDel == 'undefined') {
          callback(200, { Success: 'Items in cart successfully deleted.' });
        } else {
          callback(500, { Error: "Items in cart couldn't be deleted." });
        }
      } else {
        callback(500, { Error: "The items couldn't be deleted." });
      }
    } else {
      callback(400, { Error: 'Missing required token in header or token is invalid.' });
    }
  } else {
    callback(400, { Error: 'No shopping cart to delete' });
  }
};

/* ===================================================== */
//  Orders

handlers.orders = (data, callback) => {
  const acceptableMethods = ['post'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._orders[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for shopping cart handlers
handlers._orders = {};

// orders - post
// Required data:
// Optional data:

handlers._orders.post = async (data, callback) => {
  const token = typeof data.headers.token == 'string' ? data.headers.token : false;
  const tokenData = await _data.read('tokens', token);

  if (tokenData) {
    // Lookup user by reading token
    const email = tokenData.email;
    // Verify if the token is valid
    const tokenIsValid = await handlers._tokens.verifyToken(token, email);
    if (tokenIsValid) {
      // Check out the shopping cart item, linked to the user
      const cartData = await _data.read('cart', email);
      if (cartData) {
        // Function that calculates the total amount that must be paid
        const totalAmount = helpers.calculateTotalAmount(cartData);
        // Function integrating with the stripe api
        const chargeOrder = await helpers.stripeCharge(totalAmount);

        if (typeof chargeOrder == 'undefined') {
          // Remove the file from the cart file and place it in the orders file
          // to simulate an order being made.
          const saveOrder = await _data.moveFile('cart', 'orders', email);
          if (typeof saveOrder == 'undefined') {
            // Email a receipt to the client
            const userData = await _data.read('users', email);
            if (userData) {
              let name = userData.firstName + ' ' + userData.lastName;
              let subject = 'Pizza Receipt';
              let message = `Thank you ${name}, \n your order was successful.`;

              // Function for integrating with the mailgun api
              const mailSend = await helpers.sendEmail(email, name, subject, message);

              if (typeof mailSend == 'undefined') {
                callback(200, { Success: 'Order was successfull and receipt was mailed.' });
              } else {
                callback(500, { Error: 'Unable to send receipt via e-mail' });
              }
            }
          } else {
            callback(500, { Error: 'Failed to make the order.' });
          }
        } else {
          callback(500, { Error: 'Unable to charge credit card.' });
        }
      } else {
        callback(400, { Error: `User ${email} doesn't have a cart with items.` });
      }
    } else {
      callback(400, { Error: 'Missing required token in header or token is invalid.' });
    }
  } else {
    callback(403, { Error: 'User not found.' });
  }
};

module.exports = handlers;
