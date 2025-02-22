const express = require("express");
const genAIRouter = express.Router();
const genAIController = require('../controllers/geminiController')

genAIRouter.post('/generate', async (req, res) => {
    const database = req.app.locals.database;
    const result = await genAIController.GenerateResponse(database, req.body);
    if(result){
        res.status(200).send(result);
    }
    else{
        res.status(500).send(false);
    }
})
genAIRouter.get('/', async (req, res) => {
    const database = req.app.locals.database;
    console.log(req)
    res.status(200).send("Hello! Welcome to gen ai");
})

module.exports = genAIRouter;