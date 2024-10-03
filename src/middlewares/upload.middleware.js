const path = require('path')
const sharp = require('sharp');


const uploadMiddleware = {

  generateThumbnail: async (req, res, next) => {
    const extension = path.parse(req.file.originalname).ext.substring(1);
    if (['png', 'webp', 'jpg', 'jpeg'].includes(extension)) {
      const image = sharp(req.file.path);
      image.metadata() 
      .then(metadata => {
        if ((metadata.width > 256) || (metadata.height > 256)) {
          if (metadata.width > metadata.height) { 
            return image.resize({ width: 256 });
          } else {
            return image.resize({ height: 256 });
          }      
        } else {
          return image;
        }
      })
      .then(resizedImage => {
        resizedImage.toFile('thumbnails/' + req.file.filename);
        next();
      })
    } else {
      next();
    }
  }

}


module.exports = uploadMiddleware;