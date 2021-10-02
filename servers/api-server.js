'use strict';

const router = require('express').Router();
const dbService = require('../services/db-service');
const authService = require('../services/auth-service');
const multer  = require('multer');
const upload = multer({ dest: __dirname + '/uploads/' });

// get all event names GET
router.get('/events', async function (req, res) { 
  try {
     await authService.authApp(req, res);
     const names = await dbService.getAllEventNames(req, res);
     res.send(names).end();
  } 
  catch (err) { console.log(err); }
});

// get messages with event_id GET
router.get('/messages/:event_id', async function (req, res) { 
   try {
      await authService.authApp(req, res);
      await authService.authEvent(req, res);
      const messages = await dbService.getMessages(req, res);
      res.send(messages).end();
   } 
   catch (err) { console.log(err); }
});

// save new event POST
router.post('/events', async function (req, res) { 
   try {
      await authService.authApp(req, res);
      await authService.authUser(req, res);
      const event = await dbService.saveNewEvent(req, res);
      res.send(event).end();
   } 
   catch (err) { console.log(err); }
});

 // check event credentials POST
router.post('/signinevent', async function (req, res) { 
   try {
      await authService.authApp(req, res);
      const event = await dbService.checkEventCredentials(req, res);
      res.send(event).end(); 
   } 
   catch (err) { console.log(err); }
});

 // load deleted messages with event_id GET
router.get('/deleted/:event_id', async function (req, res) { 
   try {
      authService.authApp(req, res);
      authService.authUser(req, res);
      authService.authEvent(req, res);
      const messages = await dbService.getDeletedMessages(req, res);
      res.send(messages).end();
   } 
   catch (err) { console.log(err); }
});

  // save new message POST
router.post('/messages', async function (req, res) { 
   try {
      await authService.authApp(req, res);
      await authService.authEvent(req, res);
      await dbService.saveNewMessage(req, res);
      res.sendStatus(200);
   } 
   catch (err) { console.log(err); }
});

  // update message with _id PUT
router.put('/messages/:_id', async function (req, res) { 
   try {
      await authService.authApp(req, res);
      await authService.authEvent(req, res);
      await dbService.changeLikes(req, res);
      res.sendStatus(200).end();
   } 
   catch (err) { console.log(err); }
});

// delete message with _id DELETE
router.delete('/messages/:_id', async function (req, res) { 
   try { 
      await authService.authApp(req, res);
      await authService.authUser(req, res);
      await authService.authEvent(req, res);
      await dbService.deleteMessage(req, res);
      res.sendStatus(200).end();
   }
   catch (err) { console.log(err); }
});

// delete all from deleted DELETE
router.delete('/deleted', async function (req, res) { 
   try { 
      await authService.authApp(req, res);
      await authService.authUser(req, res);
      await authService.authEvent(req, res);
      await dbService.deleteAll(req, res);
      res.sendStatus(200).end();
   }
   catch (err) { console.log(err); }
});

// delete from deleted with _id DELETE
router.delete('/deleted/:_id', async function (req, res) { 
   try { 
      await authService.authApp(req, res);
      await authService.authUser(req, res);
      await authService.authEvent(req, res);
      await dbService.removeDeleted(req, res);
      res.sendStatus(200).end();
   }
   catch (err) { console.log(err); }
});

// update user with _id PUT
router.put('/users/:_id', async function (req, res) { 
   try {
      await authService.authApp(req, res);
      await authService.authUser(req, res);
      await dbService.updateUser(req, res);
      res.sendStatus(200).end();
   }  
   catch (err) { console.log(err); }
});

// forgot password PUT
router.put('/forgotpass', async function (req, res) { 
   try {
      await authService.authApp(req, res);
      await dbService.forgotPassword(req, res);
      res.sendStatus(200).end();
   }  
   catch (err) { console.log(err); }
});

// update user avatar with _id POST
router.post('/avatars/:_id', upload.single('file'), async function (req, res) {
   try {  
      //await authService.authApp(req, res);
      //await authService.authUser(req, res);
      const link = await dbService.updateUserAvatar(req, res);
      res.send(link).end();
   } 
   catch (err) { console.log(err); }
})

// get user with _id GET
router.get('/users/:_id', async function (req, res) { 
   try {
      await authService.authApp(req, res);
      await authService.authUser(req, res);
      const user = await dbService.getUser(req, res);
      res.send(user).end();
   } 
   catch (err) { console.log(err); }
});

// login user POST
router.post('/login', async function (req, res) { 
   try {
      await authService.authApp(req, res);
      const user = await dbService.loginUser(req, res);
      res.send(user).end();
   } 
   catch (err) { console.log(err); }
});

// register user POST
router.post('/register', async function (req, res) { 
   try {
      await authService.authApp(req, res);
      const body = await dbService.registerUser(req, res);
      res.send(body);
   } 
   catch (err) { console.log(err); }
});

// forgot email POST
router.post('/forgot/:email', async function (req, res) { 
   try {
      await authService.authApp(req, res);
      await dbService.forgotEmail(req, res);
      res.sendStatus(200).end();
   } 
   catch (err) { console.log(err); }
});

// send email POST
router.post('/email', async function (req, res) { 
   try {
      await authService.authApp(req, res);
      await authService.authUser(req, res);
      await dbService.sendEmail(req, res);
      res.sendStatus(200).end();
   } 
   catch (err) { console.log(err); }
});

module.exports = router;