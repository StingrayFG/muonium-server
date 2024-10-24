const fs = require('fs');


const diskService = {
  copyFileOnDisk: async (originalFile, newFile) => {
    return new Promise(async function(resolve, reject) {
      fs.copyFile('thumbnails/' + originalFile.name + '.' + originalFile.nameExtension, 
      'thumbnails/' + newFile.name + '.' + newFile.nameExtension, async (err) => {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          fs.copyFile('uploads/' + originalFile.name + '.' + originalFile.nameExtension, 
          'uploads/' + newFile.name + '.' + newFile.nameExtension, async (err) => {
            if (err) {
              console.log(err);
              reject(err);
            } else {
              resolve();
            }
          })
        }
      })
    })
  },

  deleteFileOnDisk: async (file) => {
    return new Promise(async function(resolve, reject) {
      fs.unlink('thumbnails/' + file.name + '.' + file.nameExtension, async (err) => {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          fs.unlink('uploads/' + file.name + '.' + file.nameExtension, async (err) => {
            if (err) {
              console.log(err);
              reject(err);
            } else {
              resolve();
            }
          })
        }
      })
    })
  }

}

module.exports = diskService;
