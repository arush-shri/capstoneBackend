const express = require("express");
const application = express();
const genAiRoute = require('./routes/genai')
const paymentRoute = require('./routes/payments')
const database = require('./controllers/dbConnector') 

const cors = require("cors");

application.use(cors());
application.use(express.json());
application.use("/genai", genAiRoute);
application.use("/payment", paymentRoute);


application.get('/', (req,res) => {
    res.status(200).send("Hello! Welcome to code reviewer");
});

database.initDb(
    function(err){
        application.listen(4000, () => {
            if(err){
                console.log(err)
                throw err;
            }
            application.locals.database = database.getDb();
            console.log("Server started at port 4000");
        });
    }
);