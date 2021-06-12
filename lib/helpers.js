/*
 * Helpers for various tasks
 */

// Dependencies
const crypto = require('crypto');
const config = require('./config');
const menuItems = require('../.data/menu/menu');
const https = require('https');
const querystring = require('querystring');

// Helper container
const helpers = {};

// Parse a JSON string to an object in all cases, without throwing an error
helpers.parseJsonToObject = str => {
  try {
    const obj = JSON.parse(str);
    return obj;
  } catch (err) {
    return {};
  }
};

// Create a SHA256 hash
helpers.hash = str => {
  if (typeof str == 'string' && str.length > 0) {
    const hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
    return hash;
  } else {
    return false;
  }
};

// Create a string of random alpha-numeric characters of a given length
helpers.createRandomString = strLength => {
  strLength = typeof strLength == 'number' && strLength > 0 ? strLength : false;
  if (strLength) {
    // Define all possible characters
    const possibleCharacters = 'abcdefghijklmnop01234567809';

    let str = '';

    for (i = 1; i <= strLength; i++) {
      const randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
      str += randomCharacter;
    }
    return str;
  } else {
    return false;
  }
};

// Function that compares items in the cart vs items in the menu and adds them in an array of objects
helpers.compareAndAddItems = async (flavId, crustId, toppingsMeatsIds, toppingsVegetablesIds) => {
  let elements = [];
  let pizzaContainer = {};
  let crustContainer = {};

  helpers.filterItems('pizzas', flavId, 'pizza', 'price', pizzaContainer);
  helpers.filterItems('crusts', crustId, 'crust', 'price', crustContainer);
  elements.push(pizzaContainer, crustContainer);

  // Meat and vegetable toppings are optional, to prevent an empty object, in the cart file
  // this if statements were added
  if (toppingsMeatsIds != false) {
    let meatsContainer = {};
    helpers.filterItems('meatToppings', toppingsMeatsIds, 'meatTopping', 'price', meatsContainer);
    elements.push(meatsContainer);
  }

  if (toppingsVegetablesIds != false) {
    let vegetablesContainer = {};
    helpers.filterItems('vegetableToppings', toppingsVegetablesIds, 'vegetablTopping', 'price', vegetablesContainer);
    elements.push(vegetablesContainer);
  }
  return elements;
};

// Filtering function
helpers.filterItems = (itemName, id, itemTag, priceTag, container) => {
  menuItems[itemName].filter(items => {
    if (id == items.id) {
      container[itemTag] = items.flavor;
      container[priceTag] = items.price;
    }
  });
};

// Calculates the total amount for the items in the shopping cart
helpers.calculateTotalAmount = shoppingCartItems => {
  let totalAmount = 0;
  shoppingCartItems.forEach(item => {
    totalAmount += item.price;
  });

  return totalAmount;
};

helpers.stripeCharge = async totalAmount => {
  // Check parameters
  amount = typeof totalAmount == 'number' && totalAmount > 0 ? totalAmount : false;

  if (amount) {
    // Configure request payload
    // Amount  parseInt(amount.toFixed(2) * 100) is in cents.
    let payload = {
      amount: parseInt(amount.toFixed(2) * 100),
      currency: 'usd',
      'payment_method_types[]': ['card'],
    };

    // Stringify the payload
    let stringPayload = querystring.stringify(payload);

    // Configure the request details
    let requestDetails = {
      protocol: 'https:',
      hostname: 'api.stripe.com',
      method: 'POST',
      path: '/v1/payment_intents',
      auth: config.stripe.secretKey,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(stringPayload),
      },
    };

    // Instantiate the request object
    const req = https.request(requestDetails, res => {
      // Grab the status of the send request
      const status = res.statusCode;

      // Used for debugging
      // res.setEncoding('utf8');
      // res.on('data', data => {
      //   console.log('Result from Stripe: ' + data);
      // });

      // console.error successful if the request went through
      if (status == 200 || status == 201) {
        console.error({ Error: false });
      } else {
        console.error('Status code returned was ' + status);
      }
    });

    // Bind to the error event so it doesn't get thrown
    req.on('error', e => {
      console.error(e);
    });

    // Add the payload
    req.write(stringPayload);

    // End the request
    req.end();
  } else {
    console.error('Given parameters were missing or invalid.');
  }
};

// Charge a credit card with Stripe
helpers.sendEmail = async (email, name, subject, message) => {
  // validate parameters
  let emailRegex = /\S+@\S+\.\S+/;
  email = typeof email === 'string' && emailRegex.test(email) ? email.trim() : false;
  name = typeof name === 'string' && name.trim().length > 2 ? name.trim() : false;
  subject = typeof subject === 'string' && subject.trim().length > 2 ? subject.trim() : false;
  message = typeof message === 'string' && message.trim().length > 2 ? message.trim() : false;
  // console.error(email && name && message);
  if (email && name && message) {
    // Configure the request payload
    let payload = {
      from: 'Pizza App <sandbox1ecfb3e29b294a56a29499de91e16522.mailgun.org>',
      to: email,
      subject: subject,
      text: message,
    };

    // Stringfy the payload
    let stringPayload = querystring.stringify(payload);

    // Configure the request details
    const requestDetails = {
      protocol: 'https:',
      hostname: 'api.mailgun.net',
      method: 'POST',
      path: '/messages',
      auth: config.mailgunKey,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(stringPayload),
      },
    };

    // Instantiate the request object
    let req = https.request(requestDetails, res => {
      // Grab the status of the sent request
      let status = res.statusCode;

      // Callback successfuly if the request went through
      if (status == 200 || status == 201) {
        console.error({ Error: false });
      } else {
        console.error('Status code returned mailgun was ' + status);
      }
    });

    // Bind to the error event so it doesn't get thrown
    req.on('error', e => {
      console.error(e);
    });

    // Add the payload
    req.write(stringPayload);

    // End the request
    req.end();
  } else {
    console.error('Given parameters are missing or invalid.');
  }
};

module.exports = helpers;
