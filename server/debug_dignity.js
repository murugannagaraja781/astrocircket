const { calculateDignity } = require('./utils/astroCalculator');

const res = calculateDignity('Mars', 10);
console.log('Mars at 10 deg:', res);

const res2 = calculateDignity('Mars', 210); // Scorpio
console.log('Mars at 210 deg:', res2);

const res3 = calculateDignity('Mars', 100); // Cancer (Neecha)
console.log('Mars at 100 deg:', res3);
