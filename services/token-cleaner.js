const state = require('./state');

const clean = function() { setInterval(() => { state.usersState.clean(); }, 60000);}

exports.clean = clean;