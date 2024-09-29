const multer = require('multer');


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname + '.' + Date.now())  
  }
})

const multerInstance = multer({ storage: storage, limits: { fileSize: 1024 * 1024 *  process.env.MAX_FILE_SIZE } });

module.exports = multerInstance;