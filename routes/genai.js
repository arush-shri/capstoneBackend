const express = require("express");
const genAIRouter = express.Router();
const genAIController = require('../controllers/geminiController')
const cryptoController = require('../controllers/cryptographyController');

genAIRouter.post('/generate', async (req, res) => {
    console.log('CPU Usage AIGEN:', process.cpuUsage());
    console.log('Memory Usage AIGEN:', process.memoryUsage());
    console.log('Uptime AIGEN:', process.uptime());
    console.log('Load Average AIGEN:', os.loadavg());
    const database = req.app.locals.database;
    const decBody = await cryptoController.DecryptBody(req.body)
    const sessionKey = decBody.sessionKey
    const result = await genAIController.GenerateResponse(database, decBody);

    const encResult = await cryptoController.EncryptBody(result, sessionKey)
    if(result && encResult){
        res.status(200).json(encResult);
    }
    else{
        res.status(500);
    }
    console.log('CPU Usage AIGEN res:', process.cpuUsage());
    console.log('Memory Usage AIGEN res:', process.memoryUsage());
    console.log('Uptime AIGEN res:', process.uptime());
    console.log('Load Average AIGEN res:', os.loadavg());
})

genAIRouter.get('/userhistory', async(req, res) => {
    console.log('CPU Usage AIHISTORY:', process.cpuUsage());
    console.log('Memory Usage AIHISTORY:', process.memoryUsage());
    console.log('Uptime AIHISTORY:', process.uptime());
    console.log('Load Average AIHISTORY:', os.loadavg());
    const database = req.app.locals.database;
    const decBody = await cryptoController.DecryptBody(req.body)
    const sessionKey = decBody.sessionKey
    const result = await genAIController.MessageHistory(database, decBody);

    const encResult = await cryptoController.EncryptBody(result, sessionKey)
    if(result && encResult){
        res.status(200).json(encResult);
    }
    else{
        res.status(500);
    }
    console.log('CPU Usage AIHISTORY res:', process.cpuUsage());
    console.log('Memory Usage AIHISTORY res:', process.memoryUsage());
    console.log('Uptime AIHISTORY res:', process.uptime());
    console.log('Load Average AIHISTORY res:', os.loadavg());
})
genAIRouter.get('/', async (req, res) => {
    res.status(200).send("Hello! Welcome to gen ai");
})

module.exports = genAIRouter;