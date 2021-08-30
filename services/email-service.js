const fs = require("fs");
const fetch = require('node-fetch');
const sendGrid = require('@sendgrid/mail');
const keys = JSON.parse(fs.readFileSync('keys.json'));

exports.checkEmail =  async function (email) {
    const url = `https://apilayer.net/api/check?access_key=${keys.apilayer}&email=${email}`;
    const response = await fetch(url, { method: 'GET', mode:'cors', headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }});
    if (response.ok) 
       return response.ok;
    
    throw Error(JSON.stringify(response));
}

exports.sendMail = async function (email, username, subject, content) {
    sendGrid.setApiKey(keys.sendgrid);
    const fullEmail = {
        to: email,
        from: 'ialexandrovivanov@gmail.com',
        subject: subject,
        text: '...',
        html: `<p><b>Hello ${username}!</b></p><br><p>${content}</p>`,
    };
    try { await sendGrid.send(fullEmail); return true; } 
    catch (err) { console.log(err); return false; }
}