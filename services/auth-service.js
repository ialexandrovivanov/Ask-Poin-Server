const state = require('../services/state');
const CryptoJs = require('crypto-js');
const { v4: uuidv4 } = require('uuid');

exports.authEvent = async function (req, res) {
    if(state.eventTokens[req.headers.event]) { return; }
    else { res.sendStatus(401); throw Error('Missing or invalid event token'); } // event unauthorized
}
exports.authUser = async function (req, res) {
    if(state.userTokens[req.headers.user]) { return; }
    else { res.sendStatus(401); throw Error('Missing or invalid user token'); } // user unauthorized
}
exports.authApp = async function (req, res) {
    const key =  await state.appsecret();
    const text = (CryptoJs.AES.decrypt(req.headers.app, key)).toString(CryptoJs.enc.Utf8);
    if(text === await state.appkey()) { return; }
    else { res.sendStatus(401); throw Error('Missing or invalid app token'); }  
}
exports.decryptBody = async function (req) {
    const key =  await state.appsecret();
    const data = await req.body.data;
    const body = (CryptoJs.AES.decrypt(data, key)).toString(CryptoJs.enc.Utf8);
    return await JSON.parse(body);
}
exports.encryptBody = async function (data) {
    const key =  await state.appsecret();
    const body = (CryptoJs.AES.encrypt(data, key)).toString();
    console.log(key, body);
    return body;
}
exports.generateUuid = function() { return uuidv4(); }