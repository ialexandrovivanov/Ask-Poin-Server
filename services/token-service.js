const { v4: uuidv4 } = require('uuid');

const generate = function() { return uuidv4(); }

module.exports = generate;
