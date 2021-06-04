/*
 * Helpers for various tasks
 */

// Dependencies

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

module.exports = helpers;
