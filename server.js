let express = require("express");
let app = express();
let bodyParser = require("body-parser");
let MongoClient = require("mongodb").MongoClient;
let admin = require("firebase-admin")
let serviceAccount = require('./firebasekeyservice.json')
let cookieParser = require('cookie-parser')
let url = "mongodb://admin:password123@ds121282.mlab.com:21282/finalapp";
let dbo;

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://final-app-63dc4.firebaseio.com"
  })

app.use(bodyParser.raw({ type: "*/*" }));

let serverState = {
    users: [],
    sessions: []
}

let testUser = {
    username: "bob",
    password: "password123",
    email: "bob@gmail.com",
    userId: 12345,
    firstName: "Bob",
    lastName: "Ford",
    location: "Montreal",
    instruments: ["guitar", "piano"],
    styles: ["classical", "flamenco"],
    skillLevel: "intermediate",
    experience: "string describing playing experience",
    seeking: ["session", "gig"],
    connections: [
        { username: "franco325", userId: 3 },
        { username: "tom", userId: 456 }
    ],
    reviews: [
        { overall: 4, skill: 5, reliability: 3, comment: "some string of feedback" },
        { overall: 3, skill: 3, reliability: 3, comment: "pretty average" }
    ]
}

// Connection to Mongo Database
MongoClient.connect(url, { useNewUrlParser: true }, (err, db) => {
    if (err) throw err;
    dbo = db.db("finalapp")
    app.listen(5000, () => {
        console.log("Listening on port 5000");
    })
})

// Creating an inital account using firebase account creation

admin.auth().onAuthStateChanged(function(user) {
    if (user) {
            let newUser = {
                username: user.username,
                password: user.password,
                userId: user.uid,
                firstName: "",
                lastName: "",
                location: "",
                instruments: [],
                styles: [],
                skillLevel: "",
                experience: "",
                seeking: [],
                connections: [],
                reviews: []
            }
            dbo.collection("users").insertOne(newUser, (err, result) => {
                if (err) throw err;
                if(result){
                console.log("account created")
                } 
            })
        
    } else {
      
    }
});

app.post('/createAccount', (req, res) => {
    let parsedBody = JSON.parse(req.body)
    let numUsers;
    dbo.collection("users").find({}).toArray((err, result) => {
        numUsers = result.length

        let newUser = {
            username: parsedBody.username,
            password: parsedBody.password,
            userId: numUsers,
            firstName: parsedBody.firstName,
            lastName: parsedBody.lastName,
            location: "",
            instruments: [],
            styles: [],
            skillLevel: "",
            experience: "",
            seeking: [],
            connections: [],
            reviews: []
        }
        dbo.collection("users").insertOne(newUser, (err, result) => {
            if (err) throw err;
            if(result){
            console.log("success")
            res.send(JSON.stringify({
                success: true,
                userID: newUser.userId
            }))} else {
                res.send(JSON.stringify({
                    success: false,
                    reason: "could not create account"
                }))
            }
        })
    })
})

app.post('/login', (req, res) => {
    let parsedBody = JSON.parse(req.body)
    let query = {username: parsedBody.username}
    dbo.collection("users").findOne(query, (err, result) => {
        if (err) throw err;
        console.log(result)
        if(result.password === parsedBody.password) {
            res.send({
                success: true,
                userId: result.userId
            })
        } else {
            res.send({
                success: false,
                reason: "could not login"
            })
        }
    })

})

app.post('/logout', (req, res) => {
    let parsedBody = JSON.parse(req.body)

})

app.post('/getUsersByCriteria', (req, res) => {
    let parsedBody = JSON.parse(req.body)

})

app.post('/getUserById', (req, res) => {
    let parsedBody = JSON.parse(req.body)
    let query = {userId: parsedBody.userId}
    dbo.collection("users").findOne(query, (err, result) => {
        if (err) throw err;
        console.log("got userById" + result)
        res.send(JSON.stringify(result))
    })

})

app.post('/modifyProfile', (req, res) => {
    let parsedBody = JSON.parse(req.body)
    let user;
    dbo.collection("users").find
})

app.post('/addContact', (req, res) => {
    let parsedBody = JSON.parse(req.body)

})

app.post('/removeContact', (req, res) => {
    let parsedBody = JSON.parse(req.body)

})

app.post('/getAllContacts', (req, res) => {
    let parsedBody = JSON.parse(req.body)

})

app.post('/reviewUser', (req, res) => {
    let parsedBody = JSON.parse(req.body)

})




// Log in endpoint to generate sessions

app.post('/sessionLogin', (req, res) => {
    // Get the ID token passed and the CSRF token.
    const idToken = JSON.parse(req.body).idToken
    let uid = ''

    admin.auth().verifyIdToken(idToken)
        .then(function (decodedToken) {
            uid = decodedToken.uid
        })
        .then(() => {


            // Set session expiration to 5 days.
            const expiresIn = 60 * 60 * 24 * 5 * 1000;
            // Create the session cookie. This will also verify the ID token in the process.
            // The session cookie will have the same claims as the ID token.
            // To only allow session cookie setting on recent sign-in, auth_time in ID token
            // can be checked to ensure user was recently signed in before creating a session cookie.
            admin.auth().createSessionCookie(idToken, { expiresIn }).then((sessionCookie) => {
                // Set cookie policy for session cookie.
                const options = { maxAge: expiresIn, httpOnly: true };
                
                //Link the cookie to the userId
                serverState.sessions[sessionCookie] = uid

                res.cookie('session', sessionCookie, options);
                res.end(JSON.stringify({ status: 'success' }));
            });
        })
})

// Sample code for getting user info with sessionId

app.post('/getInfo', (req, res) => {

    const sessionCookie = req.cookies.session

   // let response = users[serverState.sessions[sessionCookie]]
   // Was part of my setup
    
    res.send(JSON.stringify(response))

})