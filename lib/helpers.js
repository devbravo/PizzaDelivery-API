/*
 * Helpers for various tasks
 */

// Dependencies
const crypto = require('crypto');
const config = require('./config');
const menuItems = require('../.data/menu/menu');

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

module.exports = helpers;
