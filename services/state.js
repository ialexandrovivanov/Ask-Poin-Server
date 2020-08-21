const fs = require('fs');

const userTokens = { };
const eventTokens = { };

const appkey = async () => await (JSON.parse(fs.readFileSync('keys.json')).appkey);
const appsecret = async () => await (JSON.parse(fs.readFileSync('keys.json')).appsecret);

exports.userTokens = userTokens;
exports.eventTokens = eventTokens;
exports.appkey = appkey;
exports.appsecret = appsecret;