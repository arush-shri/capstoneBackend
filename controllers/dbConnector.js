require('dotenv').config();

var url = process.env.MONGODB;
const { MongoClient } = require('mongodb');
const client = new MongoClient(url);
const database = client.db("CodeReviewer");

let _database;


async function initDb(callback) {
    if (_database) {
        console.warn("Trying to init DB again!");
        return callback(null, _database);
    }
    client.connect()
    .then(()=>{
        console.log('Connected to MongoDB');
        _database = database;
        return callback(null, _database);
    })
    .catch((err) => {
        console.error('Error connecting to MongoDB:', err);
        return callback(err);
    });
}

function getDb() {
    if (!_database) {
        console.log('Database not initialized. Call initDb first.');
    }
    return _database;
}

module.exports = {
    getDb,
    initDb
};