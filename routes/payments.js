const express = require("express");
const paymentRouter = express.Router();
const paymentController = require('../controllers/paymentController')
const cryptoController = require('../controllers/cryptographyController');

paymentRouter.post('/init', async (req, res) => {
    console.log('CPU Usage PAYINIT:', process.cpuUsage());
    console.log('Memory Usage PAYINIT:', process.memoryUsage());
    console.log('Uptime PAYINIT:', process.uptime());
    console.log('Load Average PAYINIT:', os.loadavg());
    const database = req.app.locals.database;
    const decBody = await cryptoController.DecryptBody(req.body)
    const sessionKey = decBody.sessionKey
    const result = await paymentController.InitializePayment(database, decBody);

    const encResult = await cryptoController.EncryptBody(result, sessionKey)
    if(result && encResult){
        res.status(200).json(encResult);
    }
    else{
        res.status(500);
    }
    console.log('CPU Usage PAYINIT res:', process.cpuUsage());
    console.log('Memory Usage PAYINIT res:', process.memoryUsage());
    console.log('Uptime PAYINIT res:', process.uptime());
    console.log('Load Average PAYINIT res:', os.loadavg());
})
paymentRouter.post('/verify', async (req, res) => {
    console.log('CPU Usage PAYVERIFY:', process.cpuUsage());
    console.log('Memory Usage PAYVERIFY:', process.memoryUsage());
    console.log('Uptime PAYVERIFY:', process.uptime());
    console.log('Load Average PAYVERIFY:', os.loadavg());
    const database = req.app.locals.database;
    const decBody = await cryptoController.DecryptBody(req.body)
    const sessionKey = decBody.sessionKey

    const result = await paymentController.VerifyPayment(database, decBody);

    const encResult = await cryptoController.EncryptBody(result, sessionKey)
    if(result && encResult){
        res.status(200).json(encResult);
    }
    else{
        res.status(500);
    }
    console.log('CPU Usage PAYVERIFY res:', process.cpuUsage());
    console.log('Memory Usage PAYVERIFY res:', process.memoryUsage());
    console.log('Uptime PAYVERIFY res:', process.uptime());
    console.log('Load Average PAYVERIFY res:', os.loadavg());
})

module.exports = paymentRouter;