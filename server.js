let express = require("express");
let app = express();
let http = require('http');
let server = http.createServer(app);
let socketIO = require('socket.io');
let io = socketIO(server);
let bodyParser = require("body-parser");
let MongoClient = require("mongodb").MongoClient;
let admin = require("firebase-admin")
let serviceAccount = require("./firebasekeyservice.json")
let cookieParser = require("cookie-parser")
let cookieIOParser = require('socket.io-cookie-parser');
let url = "mongodb://admin:password123@ds121282.mlab.com:21282/finalapp";
let dbo;

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://final-app-63dc4.firebaseio.com"
})

app.use(cookieParser())
io.use(cookieIOParser())


app.use(bodyParser.json({ type: "text/*", limit: "100000000kb" }));


// Public Folder
app.use(express.static('./public'));

let multer = require("multer")
let path = require("path")


// Storage for uploads
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
});

// Init Upload Variable Image
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10000000
    },
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
})

// Photo file type checker
function checkFileType(file, cb) {
    // Accepted types
    const fileTypes = /jpeg|jpg|png|gif/;
    // Verify extension
    const extName = fileTypes.test(path.extname(file.originalname).toLowerCase())
    // Verify mimetype
    const mimeType = fileTypes.test(file.mimetype)

    if (mimeType && extName) {
        return cb(null, true)
    } else {
        return cb("Error: Images Only")
    }
}


let serverState = {
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
    ],
    notifications: [
        {
            notificationId: 1240953030,
            type: "contact" || "message" || "review",
            userId: "userId of user that sent the notification",
            read: false || true,
            username: "username of user that sent the notification",
            firstName: "first name of user that sent the notification",
            lastName: "last name of user that sent the notification"
        }
    ]
}

// Connection to Mongo Database
MongoClient.connect(url, { useNewUrlParser: true }, (err, db) => {
    if (err) throw err;
    dbo = db.db("finalapp")
    server.listen(5000, () => {
        console.log("Listening on port 5000");
    })
})

// Creating an inital account using firebase login information

app.get('/createAccount', (req, res) => {
    try {
        const sessionCookie = req.cookies.session
        let uid = serverState.sessions[sessionCookie]
        let query = { userId: uid }

        if (uid) {
            dbo.collection("users").findOne(query, (err, result) => {
                if (err) throw err;
                if (!result) {
                    admin.auth().getUser(uid)
                        .then((userRecord) => {

                            let newUser = {
                                username: userRecord.email.split('@')[0],
                                userId: uid,
                                firstName: '',
                                lastName: '',
                                email: userRecord.email,
                                location: '',
                                instruments: [],
                                styles: [],
                                skillLevel: '',
                                experience: '',
                                seeking: [],
                                connections: [],
                                reviews: [],
                                image: './uploads/placeholderIcon.png',
                                media: [],
                                notifications: [],
                                userRating: "-"
                            }
                            dbo.collection("users").insertOne(newUser, (err, result) => {
                                if (err) throw err;
                                if (result) {

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
    } catch (err) {
        console.log(err)
        res.send(JSON.stringify({
            success: false,
            reason: "could not process request to create account"
        }))
    }
})

app.get('/logout', (req, res) => {
    try {
        const sessionCookie = req.cookies.session
        delete serverState.sessions[sessionCookie]

        if (!serverState.sessions[sessionCookie]) {
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
    } catch (err) {
        console.log(err)
        res.send(JSON.stringify({
            success: false,
            reason: "could not process request to logout"
        }))
    }
})

app.post('/getUsersByCriteria', (req, res) => {
    try {
        let parsedBody = req.body
        const sessionCookie = req.cookies.session
        let uid = serverState.sessions[sessionCookie]

        let instrumentSearch = '';
        let styleSearch = '';
        let skillSearch = '';
        let seekingSearch = '';
        let locationSearch = '';

        instrumentSearch = parsedBody.instruments
        styleSearch = parsedBody.styles
        skillSearch = parsedBody.skillLevel
        seekingSearch = parsedBody.seeking
        locationSearch = parsedBody.location

        let instrumentRegex = new RegExp(instrumentSearch, "i")
        let styleRegex = new RegExp(styleSearch, "i")
        let skillRegex = new RegExp(skillSearch, "i")
        let seekingRegex = new RegExp(seekingSearch, "i")
        let locationRegex = new RegExp(locationSearch, "i")

        let query = {
            $and: [
                {
                    instruments: {
                        $regex: instrumentRegex
                    }
                },
                {
                    styles: {
                        $regex: styleRegex
                    }
                },
                {
                    skillLevel: {
                        $regex: skillRegex
                    }
                },
                {
                    seeking: {
                        $regex: seekingRegex
                    }
                },
                {
                    location: {
                        $regex: locationRegex
                    }
                }
            ]
        }
        if (uid) {
            dbo.collection("users").find(query).toArray((err, result) => {
                if (err) throw err;
                
                 let resultArray = result.filter(x => x.userId !== uid)

                dbo.collection("users").findOne({userId: uid}, (err, results) => {
                    if(err) throw err;

                    let filterArray = results.connections

                    for (let i = 0; i < filterArray.length; i++) {
                        resultArray = resultArray.filter(x => x.userId !== filterArray[i].connectionUserId)
                    }

                    res.send(JSON.stringify({
                        success: true,
                        result: resultArray
                    }))
                })

                
            })
        } else {
            res.send(JSON.stringify({
                success: false,
                reason: "no session ID"
            }))
        }
    } catch (err) {
        console.log(err)
        res.send(JSON.stringify({
            success: false,
            reason: "could not process request to get users by criteria"
        }))
    }
})

app.post('/getUserById', (req, res) => {
    try {
        let parsedBody = req.body
        const sessionCookie = req.cookies.session
        let uid = serverState.sessions[sessionCookie]
        let query = { userId: parsedBody.userId }
        if (uid && parsedBody.userId) {
            dbo.collection("users").findOne(query, (err, result) => {
                if (err) throw err;

                res.send(JSON.stringify(result))
            })
        } else {
            res.send(JSON.stringify({
                success: false,
                reason: "could not get users"
            }))
        }
    } catch (err) {
        console.log(err)
        res.send(JSON.stringify({
            success: false,
            reason: "could not process request to get user by Id"
        }))
    }
})

app.post('/modifyProfile', (req, res) => {
    try {
        let parsedBody = req.body
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
    } catch (err) {
        console.log(err)
        res.send(JSON.stringify({
            success: false,
            reason: "could not process request to modify profile"
        }))
    }
})

app.post('/addConnection', (req, res) => {
    try {
        let parsedBody = req.body
        const sessionCookie = req.cookies.session
        let uid = serverState.sessions[sessionCookie]
        query = { userId: uid }
        if (uid && parsedBody.connectionUserId) {
            dbo.collection("users").updateOne(query, {
                $push: {
                    connections: { connectionUserId: parsedBody.connectionUserId }
                }
            }, (err, result) => {
                if (err) throw err;
                res.send(JSON.stringify({
                    success: true
                }))
                dbo.collection("users").findOne({ userId: parsedBody.connectionUserId }, (err, result) => {
                    if (err) throw err;
                    length = result.notifications.length
                    dbo.collection("users").findOne({ userId: uid }, (err, results) => {
                        if (err) throw err;

                        dbo.collection("users").updateOne({ userId: parsedBody.connectionUserId }, {
                            $push: {
                                notifications: {
                                    notificationId: length,
                                    type: "contact",
                                    userId: uid,
                                    read: false,
                                    firstName: results.firstName,
                                    lastName: results.lastName,
                                    username: results.username
                                }
                            }
                        })
                    })
                })
            })
        } else {
            res.send(JSON.stringify({
                success: false,
                reason: "couldn't add connection"
            }))
        }
    } catch (err) {
        console.log(err)
        res.send(JSON.stringify({
            success: false,
            reason: "could not process request to add connection"
        }))
    }
})

app.post('/removeConnection', (req, res) => {
    try {
        let parsedBody = req.body
        const sessionCookie = req.cookies.session
        let uid = serverState.sessions[sessionCookie]
        query = { userId: uid }
        if (uid && parsedBody.connectionUserId) {
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
    } catch (err) {
        console.log(err)
        res.send(JSON.stringify({
            success: false,
            reason: "could not process request to remove connection"
        }))
    }
})

app.get('/getAllConnections', (req, res) => {
    try {
        const sessionCookie = req.cookies.session
        let uid = serverState.sessions[sessionCookie]
        query = { userId: uid }
        if (uid) {
            dbo.collection("users").findOne(query, (err, result) => {
                if (err) throw err;
                let temp = []
                for (let i = 0; i < result.connections.length; i++) {
                    temp = temp.concat({ userId: result.connections[i].connectionUserId })

                }

                if (temp[0] !== undefined) {
                    let searchparameter = temp;
                    let newQuery = {
                        $or: searchparameter

                    }

                    dbo.collection("users").find(newQuery).toArray((err, newResult) => {
                        if (err) throw err;

                        res.send(JSON.stringify({
                            success: true,
                            connectedUsers: newResult
                        }))
                    })
                } else {
                    res.send(JSON.stringify({
                        success: true,
                        connectedUsers: []
                    }))
                }
            })
        } else {
            res.send(JSON.stringify({
                success: false,
                reason: "couldn't get connections"
            }))
        }
    } catch (err) {
        console.log(err)
        res.send(JSON.stringify({
            success: false,
            reason: "could not process request to get all connections"
        }))
    }
})

app.post('/reviewUser', (req, res) => {
    try {
        let parsedBody = req.body
        const sessionCookie = req.cookies.session
        let uid = serverState.sessions[sessionCookie]
        let query = { userId: parsedBody.revieweeId }
        if (uid && parsedBody.revieweeId) {
            dbo.collection("users").findOne({ userId: uid }, (err, result) => {
                if (err) throw err;
                let overall = parseInt(parsedBody.review.overall)

                dbo.collection("users").updateOne(query, {
                    $push: {
                        reviews: {
                            review: {
                                overall: overall,
                                skill: parsedBody.review.skill,
                                reliability: parsedBody.review.reliability,
                                comment: parsedBody.review.comment
                            },
                            reviewer: {
                                username: result.username,
                                firstName: result.firstName,
                                lastName: result.lastName,
                                userId: uid
                            }
                        }
                    }
                }, (err, result) => {
                    if (err) throw err;
                    res.send(JSON.stringify({
                        success: true
                    }))
                    dbo.collection("users").findOne({ userId: parsedBody.revieweeId }, (err, result) => {
                        if (err) throw err;
                        length = result.notifications.length
                        let reviews = result.reviews
                        
                        dbo.collection("users").findOne({ userId: uid }, (err, results) => {
                            if (err) throw err;

                            dbo.collection("users").updateOne({ userId: parsedBody.revieweeId }, {
                                $push: {
                                    notifications: {
                                        notificationId: length,
                                        type: "review",
                                        userId: uid,
                                        read: false,
                                        firstName: results.firstName,
                                        lastName: results.lastName,
                                        username: results.username
                                    }
                                }
                            }, (err, result) => {
                                if (err) throw err;
                                let rating = 0

                                for (let i = 0; i < reviews.length; i++) {
                                    rating = rating + reviews[i].review.overall
                                }
                                rating = parseFloat((rating / reviews.length).toPrecision(3))

                                if(typeof rating !== "number"){
                                    rating = "-"
                                }

                                dbo.collection("users").updateOne({ userId: parsedBody.revieweeId }, {
                                    $set: { userRating: rating }
                                })
                            })
                        })
                    })
                })
            })
        } else {
            res.send(JSON.stringify({
                success: false,
                reason: "no session ID"
            }))
        }
    } catch (err) {
        console.log(err)
        res.send(JSON.stringify({
            success: false,
            reason: "could not process request to review user"
        }))
    }
})

app.post('/globalSearch', (req, res) => {
    try {
        let parsedBody = req.body
        const sessionCookie = req.cookies.session
        let uid = serverState.sessions[sessionCookie]
        let keyword = parsedBody.keyword
        let regexSearch = new RegExp(keyword, "i")
        let query = {
            $or: [
                {
                    instruments: {
                        $regex: regexSearch
                    }
                },
                {
                    styles: {
                        $regex: regexSearch
                    }
                },
                {
                    skillLevel: {
                        $regex: regexSearch
                    }
                },
                {
                    seeking: {
                        $regex: regexSearch
                    }
                },
                {
                    location: {
                        $regex: regexSearch
                    }
                }
            ]
        }
        if (uid) {
            dbo.collection("users").find(query).toArray((err, result) => {
                if (err) throw err;
                
                 let resultArray = result.filter(x => x.userId !== uid)

                dbo.collection("users").findOne({userId: uid}, (err, results) => {
                    if(err) throw err;

                    let filterArray = results.connections

                    for (let i = 0; i < filterArray.length; i++) {
                        resultArray = resultArray.filter(x => x.userId !== filterArray[i].connectionUserId)
                    }

                    res.send(JSON.stringify({
                        success: true,
                        users: resultArray
                    }))
                })
            })
        } else {
            res.send(JSON.stringify({
                success: false,
                reason: "no session ID"
            }))
        }
    } catch (err) {
        console.log(err)
        res.send(JSON.stringify({
            success: false,
            reason: "could not process request for global search"
        }))
    }
})

app.get('/getCurrentUser', (req, res) => {
    try {
        const sessionCookie = req.cookies.session
        let uid = serverState.sessions[sessionCookie]
        let query = { userId: uid }
        if (uid) {
            dbo.collection("users").findOne(query, (err, result) => {
                if (err) throw err;

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
    } catch (err) {
        console.log(err)
        res.send(JSON.stringify({
            success: false,
            reason: "could not process request to get current user"
        }))
    }
})

app.post('/getUserByUsername', (req, res) => {
    try {
        let parsedBody = req.body
        const sessionCookie = req.cookies.session
        let uid = serverState.sessions[sessionCookie]
        let query = { username: parsedBody.username }
        if (uid && parsedBody.username) {
            dbo.collection("users").findOne(query, (err, result) => {
                if (err) throw err;

                res.send(JSON.stringify({
                    success: true,
                    user: result
                })
                )
            })

        } else {
            res.send(JSON.stringify({
                success: false,
                reason: "could not search"
            }))
        }
    } catch (err) {
        console.log(err)
        res.send(JSON.stringify({
            success: false,
            reason: "could not process request to get user by username"
        }))
    }
})

app.post('/getConnectionsByUserId', (req, res) => {
    try {
        let parsedBody = req.body
        const sessionCookie = req.cookies.session
        let uid = serverState.sessions[sessionCookie]
        query = { userId: parsedBody.userId }
        if (uid && parsedBody.userId) {
            try {
                dbo.collection("users").findOne(query, (err, result) => {
                    if (err) throw err;
                    let temp = []
                    for (let i = 0; i < result.connections.length; i++) {
                        temp = temp.concat({ userId: result.connections[i].connectionUserId })

                    }

                    if (temp[0] !== undefined) {
                        let newQuery = {
                            $or: temp

                        }

                        dbo.collection("users").find(newQuery).toArray((err, newResult) => {
                            if (err) throw err;

                            res.send(JSON.stringify({
                                success: true,
                                connectedUsers: newResult
                            }))
                        })
                    } else {
                        res.send(JSON.stringify({
                            success: true,
                            connectedUsers: []
                        }))
                    }
                })
            } catch (err) {
                console.log(err)
                res.send(JSON.stringify({
                    success: true,
                    connectedUsers: []
                }))

            }
        } else if (uid && !parsedBody.userId) {
            res.send(JSON.stringify({
                success: false,
                reason: "couldn't find userId"
            }))
        } else if (!uid && parsedBody.userId) {
            res.send(JSON.stringify({
                success: false,
                reason: "no session ID"
            }))
        } else {
            res.send(JSON.stringify({
                success: false,
                reason: "couldn't search for connections"
            }))
        }
    } catch (err) {
        console.log(err)
        res.send(JSON.stringify({
            success: false,
            reason: "could not process request to get connections by UserId"
        }))
    }
})

app.post('/upload', upload.single("myImage"), (req, res) => {

    try {
        console.log(req.file)
        if (!req.file) {
            res.send(JSON.stringify({
                success: false,
                reason: "couldn't upload file"
            }))
        } else {
            const sessionCookie = req.cookies.session
            let uid = serverState.sessions[sessionCookie]
            query = { userId: uid }

            dbo.collection("users").updateOne(query, {
                $set: {
                    image: `/uploads/${req.file.filename}`
                }
            })
            res.send(JSON.stringify({
                success: true,
                file: `uploads/${req.file.filename}`
            }))
        }
    } catch (err) {
        console.log(err)
        res.send(JSON.stringify({
            success: false,
            reason: "could not process request to upload file"
        }))
    }
})

// Log in endpoint to generate sessions

app.post('/sessionLogin', (req, res) => {
    // Get the ID token passed and the CSRF token.
    const parsedBody = req.body
    const idToken = parsedBody.idToken
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

app.post('/readNotification', (req, res) => {
    try {
        let parsedBody = req.body
        const sessionCookie = req.cookies.session
        let uid = serverState.sessions[sessionCookie]
        let query = {
            $and: [
                { userId: uid },
                { notifications: { $elemMatch: { notificationId: parsedBody.notificationId } } }
            ]
        }
        if (uid && parsedBody.notificationId) {

            dbo.collection("users").updateOne(query, {
                $set: { "notifications.$[i].read": true }
            }, {
                    arrayFilters: [{ "i.notificationId": parsedBody.notificationId }]
                },
                (err, result) => {
                    if (err) throw err;
                    res.send(JSON.stringify({
                        success: true
                    }))
                })
        } else {
            res.send(JSON.stringify({
                success: false,
                reason: "could not read notification ID"
            }))
        }
    } catch (err) {
        console.log(err)
        res.send(JSON.stringify({
            success: false,
            reason: "could not process request to flag notification as read"
        }))
    }
})

// Chat connection

io.on('connection', socket => {

    try {
        const sessionCookie = socket.request.cookies.session;
        let uid = serverState.sessions[sessionCookie]

        let chat = {
            roomName: '',
            users: [],
            messages: []
        }

        if (uid) {
            socket.on('room', (roomInfos) => {

                let firstQuery = {
                    $and: [
                        { users: uid },
                        { users: roomInfos.otherUserId }
                    ]
                }

                dbo.collection("chats").findOne(firstQuery, (err, result) => {
                    if (err) throw err;
                    if (result) {
                        chat.roomName = roomInfos.name;
                        chat.users = result.users;
                        chat.messages = result.messages
                    } else if (!result) {
                        let insertQuery = {
                            users: [uid, roomInfos.otherUserId],
                            roomName: roomInfos.name,
                            messages: []
                        }
                        dbo.collection("chats").insertOne(insertQuery, (err, result) => {
                            if (err) throw err;

                        })
                    }
                })

                socket.join(roomInfos.name, () => {

                    io.in(chat.roomName).emit('serverMessage', { content: "you are in chat room " + chat.roomName, userId: "server", roomName: roomInfos.name })

                })
            })

            socket.on('enterChat', (message) => {

                chat.messages = []

                dbo.collection("chats").findOne({ roomName: message.roomName }, (err, result) => {
                    if (err) throw err;
                    if (result) {
                        chat.messages = result.messages
                    } else {
                        chat.messages = []
                    }

                    io.in(message.roomName).emit('previousMessages', { messages: chat.messages, roomName: message.roomName })
                })
            })

            socket.on('message', (message) => {

                const sessionCookie = socket.request.cookies.session;
                let confirmId = serverState.sessions[sessionCookie]

                if (confirmId) {

                    dbo.collection("chats").findOne({ roomName: message.roomName }, (err, result) => {
                        if (err) throw err;
                        otherUser = result.users.filter(element => element !== confirmId).toString()
                        chat.messages = result.messages

                        chat.messages = chat.messages.concat({ content: message.content, userId: confirmId, roomName: message.roomName })
                        io.in(message.roomName).emit('message', { content: message.content, userId: confirmId, roomName: message.roomName })


                        dbo.collection("chats").updateOne({ roomName: message.roomName }, {
                            $set: {
                                messages: chat.messages
                            }
                        })

                        dbo.collection("users").findOne({ userId: otherUser }, (err, result) => {
                            if (err) throw err;
                            length = result.notifications.length
                            dbo.collection("users").findOne({ userId: confirmId }, (err, results) => {
                                if (err) throw err;

                                dbo.collection("users").updateOne({ userId: otherUser }, {
                                    $push: {
                                        notifications: {
                                            notificationId: length,
                                            type: "message",
                                            userId: uid,
                                            read: false,
                                            firstName: results.firstName,
                                            lastName: results.lastName,
                                            username: results.username
                                        }
                                    }
                                })
                            })
                        })
                    })
                }
            })

            // socket.on('disconnect', () => {
            //     console.log(uid + ' connection disconnected')
            // })

        } else {
            //io.emit('connection', "you do not have a session ID")
        }
    }

    catch (err) {
        console.log(err);
    }

})