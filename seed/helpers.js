const { faker } = require('@faker-js/faker/locale/pt_BR');

// Helper function to generate random date within range
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split('T')[0];
}

// Helper function to generate random decimal within range with 2 decimal places
function randomDecimal(min, max) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

// Helper function to get random item from array
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Function to generate random CEP
function generateCEP() {
  return `${faker.number.int({ min: 10000, max: 99999 })}-${faker.number.int({ min: 100, max: 999 })}`;
}

// Function to generate tracking code
function generateTrackingCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const nums = '0123456789';
  let code = '';
  
  for (let i = 0; i < 2; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  code += ' ';
  
  for (let i = 0; i < 9; i++) {
    code += nums.charAt(Math.floor(Math.random() * nums.length));
  }
  
  code += ' ';
  code += chars.charAt(Math.floor(Math.random() * chars.length));
  code += chars.charAt(Math.floor(Math.random() * chars.length));
  
  return code;
}

module.exports = {
  randomDate,
  randomDecimal,
  getRandomItem,
  generateCEP,
  generateTrackingCode
};