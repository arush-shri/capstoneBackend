const express = require("express");
const paymentRouter = express.Router();
const paymentController = require('../controllers/paymentController')

paymentRouter.post('/init', async (req, res) => {
    const database = req.app.locals.database;
    const result = await paymentController.InitializePayment(database, req.body);
    if(result){
        res.status(200).json(result);
    }
    else{
        res.status(500).send(false);
    }
})
paymentRouter.post('/verify', async (req, res) => {
    const database = req.app.locals.database;
    const result = await paymentController.VerifyPayment(database, req.body);
    if(result){
        res.status(200).json(result);
    }
    else{
        res.status(500).send(false);
    }
})

module.exports = paymentRouter;