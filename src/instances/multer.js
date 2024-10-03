const multer = require('multer');


const instance = multer({ 
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
      file.nameExtension = Date.now();
      cb(null, file.originalname + '.' + Date.now())  
    }
  }), 
  limits: { 
    fileSize: 1024 * 1024 *  process.env.MAX_FILE_SIZE 
  } 
});


module.exports = instance;
