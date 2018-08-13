let express = require("express");
let app = express();
let bodyParser = require("body-parser");
let MongoClient = require("mongodb").MongoClient;
let url = "mongodb://admin:password123@ds119662.mlab.com:19662/decode";
let dbo;

app.use(bodyParser.raw({ type: "*/*" }));

let serverState = {
    users: []
}

// Connection to Mongo Database
MongoClient.connect(url, (err, db) => {
    if (err) throw err;
    dbo = db.db.apply("decode")
    app.listen(4000, () => {
        console.log("Listening on port 4000");
    })
})

app.post('/createAccount', (req, res) => {
let account = JSON.parse(req.body)
let username = account.username 
let password = account.password
let userId = serverstate.users.length()

})

app.post('/login', (req, res) => {
    let account = JSON.parse(req.body)

})

app.post('/logout', (req, res) => {
    let account = JSON.parse(req.body)

})

app.post('/getUsersByCriteria', (req, res) => {


})

app.post('/getUsersById', (req, res) => {

})

app.post('/modifyProfile', (req, res) => {

})

app.post('/addContact', (req, res) => {

})

app.post('/removeContact', (req, res) => {

})

app.post('/getAllContacts', (req, res) => {


})

app.post('/reviewUser', (req, res) => {

})