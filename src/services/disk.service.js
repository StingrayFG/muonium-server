const fs = require('fs');
const path = require('path');


const diskService = {
  copyFileOnDisk: async (originalFile, newFile) => {
    return new Promise(async function(resolve, reject) {
      if (['png', 'webp', 'jpg', 'jpeg'].includes(path.parse(originalFile.name).ext.substring(1))) {
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
  },

  deleteFileOnDisk: async (file) => {
    return new Promise(async function(resolve, reject) {
      if (['png', 'webp', 'jpg', 'jpeg'].includes(path.parse(file.name).ext.substring(1))) {
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
  }

}

module.exports = diskService;
