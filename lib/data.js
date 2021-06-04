/*
 *  @module lib/data
 * Library for storing and editing
 */

// Dependencies
const { open, writeFile, readFile, truncate, unlink } = require('fs/promises');
const path = require('path');
const helpers = require('/.helpers');

// Container for the module (to be exported)
const lib = {};

// Base directory of the data folder
lib.baseDir = path.join(__dirname, '/../.data/');

// Create a file and write data to it
lib.create = async (dir, file, data) => {
  const flleDir = lib.baseDir + dir + '/' + file + '.json';
  let file;
  let writtenFile;

  try {
    file = await open(fileDir, 'wx');
    const stringData = JSON.stringify(data);
    writtenFile = await writeFile(file, stringData);
    if (typeof writtenFile != 'undefined') {
      console.log('Error writing to new file.');
    }
    await file?.close();
    return writtenFile;
  } catch (err) {
    console.log('Could not create new file it may already exist');
  }
};

// Read data from a file
lib.read = async (dir, file) => {
  const fileDir = lib.baseDir + dir + '/' + file + '.json';
  try {
    const file = await readFile(fileDir, 'utf-8');
    const parsedData = helpers.parseJsonToObject(file);
    return parsedData;
  } catch (err) {
    console.error('Could not read file, it might not exist');
  }
};

// Update data in file
lib.update = async (dir, file, data) => {
  const fileDir = lib.baseDir + dir + '/' + file + '.json';
  let file;

  try {
    file = await open(fileDir, 'r+');
    const stringData = JSON.stringify(data);

    try {
      await truncate(fileDir);
      try {
        writtenFile = await writeFile(fileDir, stringData);
        await file?.close();
        return writtenFile;
      } catch (err) {
        console.error('Error writing to existing file');
      }
    } catch (err) {
      console.error('Error truncating file');
    }
  } catch (err) {
    console.error('Could not open file for updating, it may not exist yet');
  }
};

// Delete a file
lib.delete = async (dir, file) => {
  const fileDir = lib.baseDir + dir + '/' + file + '.json';
  try {
    const deletedFile = await unlink(fileDir);
    return deletedFile;
  } catch (err) {
    console.error('Erro deleting file.');
  }
};

lib.module.exports = lib;
