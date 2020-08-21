const fs = require("fs");
const keys = JSON.parse(fs.readFileSync('keys.json'));
const fetch = require('node-fetch');
const bcrypt = require('bcrypt');
const state = require('../services/state');
const mongoDbConnection = { instance: null };
const MongoClient = require('mongodb').MongoClient;
const dbService = require('../services/db-service');
const authService = require('../services/auth-service');
const tokenService = require('../services/token-service');
const emailService = require('../services/email-service');
const tempPassword = require('../services/temp-password');

exports.getDbCursor = async function (dbName, collectionName) {
    if(!mongoDbConnection.instance) { 
        mongoDbConnection.instance = await MongoClient.connect(keys.database, { useUnifiedTopology: true }); 
    }
    const db = mongoDbConnection.instance.db(`${dbName}`);
    return db.collection(`${collectionName}`);
}
exports.getAllEventNames = async function(req, res) { 
    const cursor = await dbService.getDbCursor('AskPoint', 'events');
    const eventNames = await cursor.find().project({ _id: 0, admin: 0, date: 0, password: 0 }).toArray();
    if(eventNames) { return eventNames.map(x => x.name); } 
    else { res.sendStatus(500); throw Error('Unable to get event names from db'); }  
}
exports.getMessages = async function(req, res) { 
    const cursor = await dbService.getDbCursor('AskPoint', 'messages');
    const messages = await cursor.find({ event_id: req.params.event_id }).toArray();
    return !!messages.length ? messages: [];
}
exports.saveNewEvent = async function(req, res) {
    const event =  await authService.decryptBody(req);
    const cursor = await dbService.getDbCursor('AskPoint', 'events');
    const response = await cursor.insertOne(event);
    if(response.insertedCount === 1) { 
        event.password = null;
        event.token = tokenService();
        return JSON.stringify(event); 
    }
    else { res.sendStatus(500); throw Error('Unable to save new event') }
}
exports.checkEventCredentials = async function(req, res) {
    const body = await authService.decryptBody(req);
    const cursor = await dbService.getDbCursor('AskPoint', 'events');
    const event = await cursor.findOne({ name: body.event });        
    if(event && bcrypt.compareSync(body.password, event.password)) { 
       event.token = tokenService();                 
       state.eventTokens[event.token] = Date.now();  
       return event;
    }
    else { res.sendStatus(500); throw Error('Wrong event credentials') }
}
exports.getDeletedMessages = async function(req, res) {
    const cursor = await dbService.getDbCursor('AskPoint', 'deleted');
    const messages = await cursor.find({ event_id: req.params.event_id }).toArray();
    return !!messages.length ? messages: [];
}
exports.saveNewMessage = async function(req, res) {
    const message = await req.body;
    const cursor = await dbService.getDbCursor('AskPoint', 'messages');
    const response = await cursor.insertOne(message);
    if(response.insertedCount === 1) { return; }
    else { res.sendStatus(500); throw Error('Unable to save new message') }
}
exports.deleteMessage = async function(req, res) {
    const cursorMessages = await dbService.getDbCursor('AskPoint', 'messages');
    const cursorDeleted = await dbService.getDbCursor('AskPoint', 'deleted');
    const message = await cursorMessages.findOne({ _id: req.params._id }); 
    const resDell = await cursorDeleted.insertOne(message); 
    const resMess = await cursorMessages.deleteOne({ _id: req.params._id }); 
    if(resMess.deletedCount === 1 && resDell.insertedCount === 1) { return; }
    else { res.sendStatus(500); throw Error('Unable to delete message from database'); }
}
exports.changeLikes = async function(req, res) {
    const cursor = await dbService.getDbCursor('AskPoint', 'messages');
    const updown = +req.body.updown;
    const message = await cursor.findOne({ _id: req.params._id });
    const response = await cursor.updateOne({ _id: req.params._id } , { $set: { likes : message.likes + updown }});
    if(response.modifiedCount === 1) { return; }
    else { res.sendStatus(500); throw Error('Message not modified in database'); }
}
exports.removeDeleted = async function(req, res) {
    const cursor = await dbService.getDbCursor('AskPoint', 'deleted');
    const response = await cursor.deleteOne({ _id: req.params._id }); 
    if(response.deletedCount === 1) { return; }
    else { res.sendStatus(500); throw Error('Message not deleted from deleted'); }
}
exports.deleteAll = async function(req, res) {
    const cursor = await dbService.getDbCursor('AskPoint', 'deleted');
    const response = await cursor.deleteMany({ event_id: req.body.id }); 
    if(response.deletedCount) { return; }
    else { res.sendStatus(500); throw Error('Unable to delete all from deleted'); }
}
exports.loginUser = async function(req, res) {
    const body =  await authService.decryptBody(req);
    if(!(body.email &&  body.password)) { res.sendStatus(500); throw Error('Missing body parameter'); }
    if(!(/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(.\w{2,3})+$/.test(body.email))) { res.sendStatus(500); throw Error('Invalid email'); }
    const cursor = await dbService.getDbCursor('AskPoint', 'users');
    const user = await cursor.findOne({ email: body.email });
    if(!!user && bcrypt.compareSync(body.password, user.password)) { 
        user.password = null;
        user.token = tokenService();
        state.userTokens[user.token] = Date.now();
        return JSON.stringify(user); 
    }
    else { res.sendStatus(401); throw Error('Invalid credentials'); }
}
exports.updateUser = async function(req, res) {
    const body = await authService.decryptBody(req);
    const cursorUsers = await dbService.getDbCursor('AskPoint', 'users');
    const cursorMessages = await dbService.getDbCursor('AskPoint', 'messages');
    const user = await cursorUsers.findOne({ _id: req.params._id });
    const password = body.password ? await bcrypt.hash(body.password, 10) : user.password;
    const username = body.username ? body.username : user.username;
    const responseUsers = await cursorUsers.updateOne({ _id: req.params._id }, { $set: { password: password, username: username }});
    await cursorMessages.updateMany({ user_id: req.params._id }, { $set: { username: username } });
    if(responseUsers.modifiedCount === 1) { return; }
    else { res.sendStatus(500); throw Error('User not updated in database'); }
}
exports.registerUser = async function(req, res) {
    const body = await authService.decryptBody(req);
    if(!(body.email && body.username)) { res.sendStatus(500); throw Error('Missing body parameter'); }
    if(!(/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(.\w{2,3})+$/.test(body.email))) { res.sendStatus(500); throw Error('Invalid email'); }
    if(!body.username.match('^[a-zA-Z0-9 ]+$')) { res.sendStatus(500); throw Error('Invalid symbols in username'); }
    if(body.username.length < 3) { res.sendStatus(500); throw Error('Inavalid username length'); }
    const isvalid = await emailService.checkEmail(body.email);
    if(!isvalid) { res.sendStatus(401); throw Error('Invalid email'); }
    else {
        const cursor = await dbService.getDbCursor('AskPoint', 'users');
        const user = await cursor.findOne({ email: body.email });
        if(user) { res.sendStatus(409); throw Error('A user with this email is already registerd') }
        else {
            const token = tokenService();
            const password = tempPassword();
            const hashedPassword = await bcrypt.hash(password, 10);
            const _id = authService.generateUuid();
            const resultDb = await cursor.insertOne({ _id: _id, email: body.email, username: body.username, password: hashedPassword, image: "" });
            const resultEmail = await emailService.sendMail(body.email, body.username, "Successfull registration to AskPoint!", `<p>You have been registered to <a href="http://localhost:8080/"><b>--- AskPoint ---</b></a> with temporary password: ${password}</p><p>In profile section you can change your password right after first login</p><p>Your login credentials: { email: ${body.email}, password: ${password} }</p><p><a href="http://localhost:8080/login"><b>--- Login page ---</b></a></p>`)
            if(resultDb.insertedCount === 1 && resultEmail) { 
               state.userTokens[token] = Date.now(); 
               const data = await authService.encryptBody(token);
               const body = JSON.stringify({ data: data })
               return JSON.stringify(body); 
            }
            else { res.sendStatus(500); throw Error('Not registered successfully'); } 
        }
    }
} 
exports.forgotEmail = async function(req, res) {
    if(!(/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(.\w{2,3})+$/.test(req.params.email))) { res.sendStatus(500); throw Error('Invalid email'); }
    if(!emailService.checkEmail(req.params.email)) { res.sendStatus(500); throw Error(`provided email: ${req.params.email} is not real email address`); }
    const cursor = await dbService.getDbCursor('AskPoint', 'users');
    const user = await cursor.findOne({ email: req.params.email });
    const password = tempPassService.generate();
    if(user) { 
        await emailService.sendMail(user.email, user.username, `Your temporary password is: ${password}  Click <a href="http://localhost:8080/login"><b>--- here ---</b></a> to go to login page`); 
        return;
    }
    else { res.sendStatus(500); throw Error('User with provided email cannot be found') }
}
exports.getUser = async function(req, res) {
    const cursor = await dbService.getDbCursor('AskPoint', 'users');
    const user = await cursor.findOne({ _id: req.params._id }, { projection: { password: 0 } });
    if(user) { return JSON.stringify(user); }
    else { res.sendStatus(500); throw Error('Cannot get user from db'); }
}
exports.updateUserAvatar = async function(req, res) {
    console.log(req.file.filename, keys.imgur);
    // req.file is the image file, req.body will hold the text methadata fields if there are any.
    const responseImgur = await fetch('https://api.imgur.com/3/image', {
       method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Client-ID ${keys.imgur}` },
       body: fs.createReadStream(__dirname + `/uploads/${req.file.filename}`) 
    });
    console.log(responseImgur);

    if(responseImgur.ok) {
        fs.unlinkSync(__dirname + `/uploads/${req.file.filename}`); // delete uploaded file but can be kept
        const body = await responseImgur.json();
        console.log(body.data.link+'<-imgur link');
        const cursorUsers = await dbService.getDbCursor('AskPoint', 'users');
        const cursorMessages = await dbService.getDbCursor('AskPoint', 'messages');
        const responseDb = await cursorUsers.updateOne({ _id: new ObjectID(req.params._id) }, { $set: { image: body.data.link }}); 
        await cursorMessages.updateMany({ user_id: req.params._id }, { $set: { image: body.data.link }}); 
        if(responseDb.modifiedCount === 1) { return JSON.stringify({ link: body.data.link }); }
        else { res.sendStatus(500); throw Error('Avatar link is not updated in database') }
    }
    else { res.sendStatus(500); throw Error('File not uploaded to image API') }
}
exports.sendEmail = async function(req, res) {
    const body = await req.body;
    const cursor = await dbService.getDbCursor('AskPoint', 'users');
    const fromuser = await cursor.findOne({ _id: body.from_id });
    const touser = await cursor.findOne({ _id: body.to_id });
    const result = await emailService.sendMail(touser.email, touser.username, `Personal message sent from ${fromuser.username} sent via AskPoint platform`, body.content + `<p>You can write back to <b>${fromuser.username}</b> on <b>${fromuser.email}</b></p>`)
    if(result) { return; }
    else { res.sendStatus(500); throw Error('Unable to sent email'); }
}
exports.forgotPassword = async function(req, res) {
    const cursor = await dbService.getDbCursor('AskPoint', 'users');
    const user = await cursor.findOne({ email: req.body.email });
    const passwordHashed = req.body.password ? await bcrypt.hash(req.body.password, 10) : user.password;
    const response = await cursor.updateOne({ email: req.body.email }, { $set: { password: passwordHashed }});
    const emailSent = await emailService.sendMail(user.email, '', 'Password reset for AskPoint', `Your temporary password is: <b>${req.body.password}</b>  Click <a href="http://localhost:8080/login"><b> ---> HERE <--- </b></a> to go to login page`);
    if(response.modifiedCount === 1 && emailSent) { return; }
    else { 
        await cursor.updateOne({ _id: new ObjectID(req.params._id) }, { $set: { password: user.password }});
        res.sendStatus(500); throw Error('User was not updated in database'); 
    }
}