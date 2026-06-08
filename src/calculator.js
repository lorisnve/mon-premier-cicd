// src/calculator.js

// CORRECTION :
function add(a, b) {
  return a + b; // ← Correction : addition
}

// APRÈS (bug volontaire) :
// function add(a, b) {
//  return a - b; // ← Bug : soustraction au lieu d'addition !
// }

// var unused = 42;

function subtract(a, b) {
  return a - b;
}
function multiply(a, b) {
  return a * b;
}
function divide(a, b) {
  if (b === 0) throw new Error('Division par zéro impossible');
  return a / b;
}
module.exports = { add, subtract, multiply, divide };
