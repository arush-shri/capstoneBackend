const express = require("express");
const authRouter = express.Router();
const authController = require('../controllers/authController');
const os = require('os');
const cryptoController = require('../controllers/cryptographyController');

authRouter.post('/signup', async (req, res) => {
    console.log('CPU Usage SIGNUP:', process.cpuUsage());
    console.log('Memory Usage SIGNUP:', process.memoryUsage());
    console.log('Uptime SIGNUP:', process.uptime());
    console.log('Load Average SIGNUP:', os.loadavg());
    const database = req.app.locals.database;
    const decBody = await cryptoController.DecryptBody(req.body)
    const sessionKey = decBody.sessionKey
    
    const result = await authController.SingUpUser(database, decBody);

    const encResult = await cryptoController.EncryptBody(result, sessionKey)

    if(result && encResult){
        res.status(200).json(encResult);
    }
    else{
        res.status(500);
    }
    console.log('CPU Usage SIGNUP res:', process.cpuUsage());
    console.log('Memory Usage SIGNUP res:', process.memoryUsage());
    console.log('Uptime SIGNUP res:', process.uptime());
    console.log('Load Average SIGNUP res:', os.loadavg());
})
authRouter.post('/signin', async (req, res) => {
    console.log('CPU Usage SIGNIN:', process.cpuUsage());
    console.log('Memory Usage SIGNIN:', process.memoryUsage());
    console.log('Uptime SIGNIN:', process.uptime());
    console.log('Load Average SIGNIN:', os.loadavg());
    const database = req.app.locals.database;
    const decBody = await cryptoController.DecryptBody(req.body)
    const sessionKey = decBody.sessionKey

    const result = await authController.SignInUser(database, decBody);

    const encResult = await cryptoController.EncryptBody(result, sessionKey)

    if(result && encResult){
        res.status(200).json(encResult);
    }
    else{
        res.status(500);
    }
    console.log('CPU Usage SIGNIN res:', process.cpuUsage());
    console.log('Memory Usage SIGNIN res:', process.memoryUsage());
    console.log('Uptime SIGNIN res:', process.uptime());
    console.log('Load Average SIGNIN res:', os.loadavg());
})
authRouter.post('/resendmfa', async (req, res) => {
    console.log('CPU Usage RESENDMFA:', process.cpuUsage());
    console.log('Memory Usage RESENDMFA:', process.memoryUsage());
    console.log('Uptime RESENDMFA:', process.uptime());
    console.log('Load Average RESENDMFA:', os.loadavg());
    const database = req.app.locals.database;
    const decBody = await cryptoController.DecryptBody(req.body)
    const sessionKey = decBody.sessionKey

    const result = await authController.ResendMFACode(database, decBody);

    const encResult = await cryptoController.EncryptBody(result, sessionKey)
    if(result && encResult){
        res.status(200).json(encResult);
    }
    else{
        res.status(500);
    }
    console.log('CPU Usage RESENDMFA res:', process.cpuUsage());
    console.log('Memory Usage RESENDMFA res:', process.memoryUsage());
    console.log('Uptime RESENDMFA res:', process.uptime());
    console.log('Load Average RESENDMFA res:', os.loadavg());
})
authRouter.post('/mfaverify', async (req, res) => {
    console.log('CPU Usage MFAVERIFY:', process.cpuUsage());
    console.log('Memory Usage MFAVERIFY:', process.memoryUsage());
    console.log('Uptime MFAVERIFY:', process.uptime());
    console.log('Load Average MFAVERIFY:', os.loadavg());
    const database = req.app.locals.database;
    const decBody = await cryptoController.DecryptBody(req.body)
    const sessionKey = decBody.sessionKey
    const result = await authController.ValidateMfaCode(database, decBody);

    const encResult = await cryptoController.EncryptBody(result, sessionKey)
    if(result && encResult){
        res.status(200).json(encResult);
    }
    else{
        res.status(500);
    }
    console.log('CPU Usage MFAVERIFY res:', process.cpuUsage());
    console.log('Memory Usage MFAVERIFY res:', process.memoryUsage());
    console.log('Uptime MFAVERIFY res:', process.uptime());
    console.log('Load Average MFAVERIFY res:', os.loadavg());
})

module.exports = authRouter;