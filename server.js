let express = require("express");
let app = express();
let bodyParser = require("body-parser");
let MongoClient = require("mongodb").MongoClient;
let admin = require("firebase-admin")
let serviceAccount = require("./firebasekeyservice.json")
let cookieParser = require("cookie-parser")
let uploader = require("./uploader.js")
let url = "mongodb://admin:password123@ds121282.mlab.com:21282/finalapp";
let dbo;


admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://final-app-63dc4.firebaseio.com"
  })


app.use(bodyParser.raw({ type: "*/*" }));

// Public Folder
app.use(express.static('./public'));

let serverState = {
    users: [],
    sessions: {}
}


// Test user for passing hard coded data
let testUser = {
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
        { userId: 3 },
        { userId: 456 }
    ],
    reviews: [
        { reviewerId: 456, overall: 4, skill: 5, reliability: 3, comment: "some string of feedback" },
        { reviewerId: 3, overall: 3, skill: 3, reliability: 3, comment: "pretty average" }
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

// Creating an inital account using firebase account

app.post('/createAccount', (req, res) => {

    const sessionCookie = req.cookies.session
    let uid = serverState.sessions[sessionCookie]
    let query = { userId: uid }

    if (uid) {
        dbo.collection("users").findOne(query, (err, result) => {
            if (err) throw err;
            if (!result.userId) {
                admin.auth().getUser(uid)
                    .then((userRecord) => {

                        let newUser = {
                            userId: uid,
                            firstName: '',
                            lastName: '',
                            email: userRecord.email,
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
                            if (result) {
                                console.log("success")
                                res.send(JSON.stringify({
                                    success: true,
                                    userID: newUser.userId
                                }))
                            } else {
                                res.send(JSON.stringify({
                                    success: false,
                                    reason: "could not create account"
                                }))
                            }
                        })
                    })
            } else {
                res.send(JSON.stringify({
                    success: true,
                    reason: "account already exists"
                }))
            }
        })
    } else {
        res.send(JSON.stringify({
            success: false,
            reason: "no session ID"
        }))
    }
})

app.post('/logout', (req, res) => {
    const sessionCookie = req.cookies.session
    delete serverState.sessions[sessionCookie]

    if(!serverState.sessions[sessionCookie]) {
        res.send(JSON.stringify({
            success: true,
            reason: "successfully logged out"
        }
        ))
    } else {
        res.send(JSON.stringify({
            success: false,
            reason: "could not logout"
        }))
    }

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
    const sessionCookie = req.cookies.session
    let uid = serverState.sessions[sessionCookie]
    query = { userId: uid }
    if (uid) {
        dbo.collection("users").updateOne(query, {
            $set: {
                location: parsedBody.location,
                firstName: parsedBody.firstName,
                lastName: parsedBody.lastName,
                instruments: parsedBody.instruments,
                seeking: parsedBody.seeking,
                styles: parsedBody.styles,
                skillLevel: parsedBody.skillLevel,
                experience: parsedBody.experience
            }
        }, (err, result) => {
            if (err) throw err;
            console.log("profile modified")
            res.send(JSON.stringify({
                success: true
            }))
        })
    } else {
        res.send(JSON.stringify({
            success: false,
            reason: "could not update profile"
        }))
    }
})

app.post('/addConnection', (req, res) => {
    let parsedBody = JSON.parse(req.body)
    const sessionCookie = req.cookies.session
    let uid = serverState.sessions[sessionCookie]
    query = { userId: uid }
    if (uid) {
        dbo.collection("users").updateOne(query, {
            $push: {
                connections: { connectionUserId: parsedBody.connectionUserId }
            }
        }, (err, result) => {
            if (err) throw err;
            res.send(JSON.stringify({
                success: true
            }))
        })
    } else {
        res.send(JSON.stringify({
            success: false,
            reason: "couldn't add connection"
        }))
    }
})

app.post('/removeConnection', (req, res) => {
    let parsedBody = JSON.parse(req.body)
    const sessionCookie = req.cookies.session
    let uid = serverState.sessions[sessionCookie]
    query = { userId: uid }
    if (uid) {
        dbo.collection("users").updateOne(query, {
            $pull: {
                connections: { connectionUserId: parsedBody.connectionUserId }
            }
        }, (err, result) => {
            res.send(JSON.stringify({
                success: true
            }))
        })
    } else {
        res.send(JSON.stringify({
            success: false,
            reason: "couldn't remove connection"
        }))
    }

})

app.post('/getAllConnections', (req, res) => {
    const sessionCookie = req.cookies.session
    let uid = serverState.sessions[sessionCookie]
    query = { userId: uid }
    if (uid) {
        dbo.collection("users").findOne(query, (err, result) => {
            if(err) throw err;
            res.send(JSON.stringify({
                success: true,
                connectedUsers: result.connections
            }))
        })
    } else {
        res.send(JSON.stringify({
            success: false,
            reason: "couldn't remove connection"
        }))
    }


})

app.post('/reviewUser', (req, res) => {
    let parsedBody = JSON.parse(req.body)
    const sessionCookie = req.cookies.session
    let uid = serverState.sessions[sessionCookie]
    let query = { userId: parsedBody.revieweeId }
    if (uid) {
        dbo.collection("users").updateOne(query, {
            $push: {
                reviews: {
                    reviewerId: uid,
                    review: {
                        overall: parsedBody.overall,
                        skill: parsedBody.skill,
                        reliability: parsedBody.reliability,
                        comment: parsedBody.comment
                    }
                }
            }

        }, (err, result) => {
            if (err) throw err;
            res.send(JSON.stringify({
                success: true
            }))
        })
    } else {
        res.send(JSON.stringify({
            success: false,
            reason: "no session ID"
        }))
    }
})

app.post('/globalSearch', (req, res) => {
    let parsedBody = JSON.parse(req.body)
    const sessionCookie = req.cookies.session
    let uid = serverState.sessions[sessionCookie]
    let keyword = parsedBody.keyword
    let regexSearch = new RegExp(keyword, "i")
    let query = {

    }
    if(uid) {
        
    } else {
        res.send(JSON.stringify({
            success: false,
            reason: "no session ID"
        }))
    }
})

app.post('/getCurrentUser', (req, res) => {
    const sessionCookie = req.cookies.session
    let uid = serverState.sessions[sessionCookie]
    let query = { userId: uid }
    if (uid) {
        dbo.collection("users").findOne(query, (err, result) => {
            if (err) throw err;
            console.log("got userById" + result)
            res.send(JSON.stringify({
                success: true,
                user: result
            }))
        })
    } else {
        res.send(JSON.stringify({
            success: false,
            reason: "no session ID"
        }))
    }
})

app.post('/getUserByUsername', (req, res) => {
    let parsedBody = JSON.parse(req.body)
    if (parsedBody.username) {
        res.send(JSON.stringify({
            success: true,
            user: otherUsers[0]
        }))
    } else {
        res.send(JSON.stringify({
            success: false,
            reason: "could not search"
        }))
    }
})

app.post('/upload', (req, res) => {
    uploader.upload(req, res, (err) => {
        if (err) {
            res.send({
                success: false
            })
        }
    })
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

app.post('/test', (req, res) => {
    let parsedBody = JSON.parse(req.body)
    let email = '';
    admin.auth().getUser(parsedBody.uid)
        .then((userRecord) => {
            email = userRecord.email
        })

    console.log(email)
})


// For app.js
// INFO for UPLOAD
// Form must have action="/upload" method="POST" enctype="multipart/form-data"
// Input type="file" name="someName"
// Can include a ternary operator to reflect upload status