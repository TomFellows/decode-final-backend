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

let otherUsers = [
    {
        username: "franco325",
        password: "pwd123",
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
            { username: "bob", userId: 12345 },
            { username: "tom", userId: 456 }
        ],
        reviews: [
            { overall: 3, skill: 1, reliability: 5, comment: "Francis is always present ahead of time and ready to go, but vastly overestimates his abilities" },
            { overall: 3, skill: 5, reliability: 1, comment: "Super unreliable, but a musical genius" }
        ]
    },
    {
        username: "tom",
        password: "password1",
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
            { username: "bob", userId: 12345 },
            { username: "franco325", userId: 3 }
        ],
        reviews: [
            { overall: 5, skill: 3, reliability: 5, comment: "Perfect last minute fill-in for our gig" },
            { overall: 3, skill: 2, reliability: 4, comment: "Struggled with the material, but was dedicated to getting it right" }
        ]
    }
]


// Connection to Mongo Database
MongoClient.connect(url, (err, db) => {
    if (err) throw err;
    dbo = db.db("decode")
    app.listen(4000, () => {
        console.log("Listening on port 4000");
    })
})

app.post('/createAccount', (req, res) => {
let account = JSON.parse(req.body)
if(account.username && account.password) {
    res.send(JSON.stringify({
        success: true,
        userId: 12345
    }))
}else {
    res.send(JSON.stringify({
        success: false,
        reason: "account could not be created"
    }))
}

})

app.post('/login', (req, res) => {
    let account = JSON.parse(req.body)
    if(account.username && account.password) {
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
    if(account.username) {
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
    if(search.instrument || search.style || search.seeking) {
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
    if(account.userId) {
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
    if(account.userId || account.instrument || account.style || account.seeking) {
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
    if(account.userId && account.connectionUserId) {
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
    if(account.userId && account.connectionUserId) {
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
    if(account.userId) {
        res.send(JSON.stringify({
            success: true,
            connectedUsers: [otherUsers[0],otherUsers[1]]
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
    if(account.userId && account.revieweeId && account.review) {
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
    if(search.keyword) {
        res.send(JSON.stringify({
            success: true,
            users: [
                otherUsers[0]
            ]
        } ) )
    } else {
        res.send(JSON.stringify({
            success: false,
            reason: "could not search"
        }))
    }
});