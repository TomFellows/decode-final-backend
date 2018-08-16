let multer = require("multer")


// Storage for uploads
let storage = multer.diskStorage({ 
    destination: './public/uploads/',
    filename: function(req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
});

// Init Upload Variable
let upload = multer({
    storage: storage,
    fileFilter: function(req, file, cb) {
        checkFileType(file, cb);
    }
}).single("image")

// Photo file type checker
function checkFileType(file, cb) {
    // Accepted types
    let fileTypes = /jpeg|jpg|png|gif/;
    // Verify extension
    let extName = fileTypes.test(path.extname(file.originalname).toLowerCase())
    // Verify mimetype
    let mimeType = fileTypes.test(file.mimetype)

    if(mimeType && extName){
        return cb(null, true)
    } else {
        return cb("Error: Images Only")
    }
}

