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

app.use(cookieParser())
app.use(bodyParser.raw({ type: "*/*" }));

let serverState = {
    users: [],
    sessions: {}
}

let testUser = {
    username: "Bobster",
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
        { reviewerId: 3, review: { overall: 4, skill: 5, reliability: 3, comment: "some string of feedback" } },
        { reviewerId: 456, review: { overall: 3, skill: 3, reliability: 3, comment: "pretty average" } }
    ]
}

let otherUsers = [
    {
        username: "franco345",
        email: "ffc@gmail.com",
        userId: 3,
        firstName: "Francis",
        lastName: "Copolla",
        location: "Los Angeles",
        instruments: ["piano", "vuvuzela"],
        styles: ["experimental", "psychedelic"],
        skillLevel: "intermediate",
        experience: "years playing with touring psychedelic symphonies",
        seeking: ["jam", "gig"],
        connections: [
            { userId: 12345 },
            { userId: 456 }
        ],
        reviews: [
            { reviewerId: 12345, review: { overall: 3, skill: 1, reliability: 5, comment: "Francis is always present ahead of time and ready to go, but vastly overestimates his abilities" } },
            { reviewerId: 456, review: { overall: 3, skill: 5, reliability: 1, comment: "Super unreliable, but a musical genius" } }
        ]
    },
    {
        username: "tommyknocker",
        email: "tomasfellows@gmail.com",
        userId: 456,
        firstName: "Tomas",
        lastName: "Fellows",
        location: "Montreal",
        instruments: ["bass", "guitar", "keyboard"],
        styles: ["indie", "rock", "electronic", "experimental"],
        skillLevel: "intermediate",
        experience: "7 years playing, writing, and recording in a band",
        seeking: ["jam", "gig", "project"],
        connections: [
            { userId: 12345 },
            { userId: 3 }
        ],
        reviews: [
            { reviewerId: 12345, review: { overall: 5, skill: 3, reliability: 5, comment: "Perfect last minute fill-in for our gig" } },
            { reviewerId: 3, review: { overall: 3, skill: 2, reliability: 4, comment: "Struggled with the material, but was dedicated to getting it right" } }
        ]
    }
]


// Connection to Mongo Database
MongoClient.connect(url, { useNewUrlParser: true }, (err, db) => {
    if (err) throw err;
    dbo = db.db("finalapp")
    app.listen(4000, () => {
        console.log("Listening on port 4000");
    })
})

app.post('/createAccount', (req, res) => {
    let account = JSON.parse(req.body)
    if (account.username && account.password) {
        res.send(JSON.stringify({
            success: true,
            userId: 12345
        }))
    } else {
        res.send(JSON.stringify({
            success: false,
            reason: "account could not be created"
        }))
    }

})

app.post('/login', (req, res) => {
    let account = JSON.parse(req.body)
    if (account.username && account.password) {
        res.send(JSON.stringify({
            success: true,
            userId: 12345
        }))
    } else {
        res.send(JSON.stringify({
            success: false,
            reason: "could not log in"
        }))
    }

})

app.post('/logout', (req, res) => {
    let account = JSON.parse(req.body)
    if (account.username) {
        res.send(JSON.stringify({
            success: true
        }))
    } else {
        res.send(JSON.stringify({
            success: false,
            reason: "couldn't log out"
        }))
    }
})

app.post('/getUsersByCriteria', (req, res) => {
    let search = JSON.parse(req.body)
    if (search.instrument || search.style || search.seeking) {
        res.send(JSON.stringify({
            success: true,
            result: [
                testUser, otherUsers[0]
            ]
        }))
    } else {
        res.send(JSON.stringify({
            success: false,
            reason: "couldn't search"
        }))
    }

})

app.post('/getUserById', (req, res) => {
    let account = JSON.parse(req.body)
    if (account.userId) {
        res.send(JSON.stringify({
            success: true,
            user: otherUsers[1]
        }))
    } else {
        res.send(JSON.stringify({
            success: false,
            reason: "couldn't get user"
        }))
    }
})

app.post('/modifyProfile', (req, res) => {
    let account = JSON.parse(req.body)
    if (account.userId || account.instruments || account.styles || account.seeking) {
        res.send(JSON.stringify({
            success: true
        }))
    } else {
        res.send(JSON.stringify({
            success: false,
            reason: "couldn't modify profile"
        }))
    }
})

app.post('/addConnection', (req, res) => {
    let account = JSON.parse(req.body)
    if (account.userId && account.connectionUserId) {
        res.send(JSON.stringify({
            success: true
        }))
    } else {
        res.send(JSON.stringify({
            success: false,
            reason: "couldn't make connection"
        }))
    }
})

app.post('/removeConnection', (req, res) => {
    let account = JSON.parse(req.body)
    if (account.userId && account.connectionUserId) {
        res.send(JSON.stringify({
            success: true
        }))
    } else {
        res.send(JSON.stringify({
            success: false,
            reason: "couldn't remove connection"
        }))
    }
})

app.post('/getAllConnections', (req, res) => {
    let account = JSON.parse(req.body)
    if (account.userId) {
        res.send(JSON.stringify({
            success: true,
            connectedUsers: [otherUsers[0], otherUsers[1]]
        }))
    } else {
        res.send(JSON.stringify({
            success: false,
            reason: "couldn't get connections"
        }))
    }

})

app.post('/reviewUser', (req, res) => {
    let account = JSON.parse(req.body)
    if (account.userId && account.revieweeId && account.review) {
        res.send(JSON.stringify({
            success: true
        }))
    } else {
        res.send(JSON.stringify({
            success: false,
            reason: "couldn't post review"
        }))
    }
})

app.post('/globalSearch', (req, res) => {
    let search = JSON.parse(req.body)
    if (search.keyword) {
        res.send(JSON.stringify({
            success: true,
            users: [
                otherUsers[0]
            ]
        }))
    } else {
        res.send(JSON.stringify({
            success: false,
            reason: "could not search"
        }))
    }
});

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
                user: testUser
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
                res.send(JSON.stringify({ status: 'success' }));
            });
        })
})

app.post('/getInfo', (req, res) => {

    const sessionCookie = req.cookies.session

    let response = users[serverState.sessions[sessionCookie]]

    res.send(JSON.stringify(response))

})