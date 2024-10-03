const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const driveService = require('../services/drive.service.js')
const fileService = require('../services/file.service.js')

const fileController = {

  getFileDownloadToken: async (req, res, next) => {
    const downloadToken = jwt.sign({ uuid: req.body.fileData.uuid }, process.env.ACCESS_TOKEN_SECRET);
    return res.send({ downloadToken });
  },

  downloadFile: async (req, res, next) => {
    jwt.verify(req.params.token, process.env.ACCESS_TOKEN_SECRET, async (err, file) => {
      console.log(err,file)
      if (err) { 
        return res.sendStatus(403); 
      } else if (file.uuid != req.params.uuid) { 
        return res.sendStatus(403); 
      } else if ((Math.floor(Date.now() / 1000) - file.iat) > 300) { 
        return res.sendStatus(410); 
      } 
      else {
        await fileService.getFile({ uuid: req.params.uuid })
        .then(fileData => {
          if (fileData) {
            res.set('Content-Disposition', `attachment; filename="${ fileData.name }"`);
            return res.sendFile(fileData.name + '.' + fileData.nameExtension, { root: 'uploads/' });
          } else {
            return res.status(404);
          }
        })
        .catch(err => {
          console.log(err);
          return res.sendStatus(500);
        })
      } 
    })
  },

  uploadFile: async (req, res, next) => {
    await fileService.createFile(req.body.fileData)
    .then(async fileData => {
      await driveService.updateDriveUsedSpace(req.drive, req.file.size)
      .then(() => {
        return res.send({ fileData });
      })
    }) 
    .catch(err => {
      console.log(err);
      return res.sendStatus(500);
    }) 
  },

  copyFile: async (req, res, next) => {
    const originalFile = req.file;

    const modificationDate = Date.now();

    if ((originalFile.parentUuid === req.body.fileData.parentUuid) && (path.parse(originalFile).name === req.body.fileData.name)) {
      return res.sendStatus(409);
    } else {
      req.body.fileData.uuid = crypto.randomUUID();
      req.body.fileData.nameExtension = modificationDate + '';
      req.body.fileData.modificationDate = new Date(modificationDate);    
      req.body.fileData.creationDate = new Date(modificationDate);  
      delete req.body.fileData.type;  
    }

    // File is copied first to mitigate the possibility of files getting created in the database but not on the disk
    fs.copyFile('uploads/' + originalFile.name + '.' + originalFile.nameExtension, 
    'uploads/' +  req.body.fileData.name + '.' + req.body.fileData.nameExtension, async (err) => {
      if (err) {
        console.log(err);
        return res.sendStatus(500);
      } else {
        await fileService.createFile(req.body.fileData) 
        .then(async fileData => {
          await driveService.updateDriveUsedSpace(req.drive, req.file.size)
          .then(() => {
            return res.send({ fileData });
          })
        })
        .catch(err => {
          console.log(err)
          return res.sendStatus(500);
        }) 
      }
    })
  },

  renameFile: async (req, res, next) => {
    const originalFile = req.file;

    const modificationDate = Date.now();
    req.body.fileData.nameExtension = modificationDate + '';
    req.body.fileData.modificationDate = new Date(modificationDate);

    await fileService.updateFileName(req.body.fileData)
    .then(fileData => {
      fs.rename('uploads/' + originalFile.name + '.' + originalFile.nameExtension, 
      'uploads/' + req.body.fileData.name + '.' + req.body.fileData.nameExtension, async (err) => {
        if (err) {
          console.log(err)
          await fileService.updateFileName(req.file) // Revert file data in the database
          .then(() => {
            return res.sendStatus(500);
          })
        } else {
          return res.send({ fileData });
        }
      })
    })
    .catch(err => {
      console.log(err)
      return res.sendStatus(500);
    }) 
  },

  moveFile: async (req, res, next) => {
    await fileService.updateFileParent(req.body.fileData)
    .then(fileData => {
      return res.send({ fileData });
    })
    .catch(() => {
      return res.sendStatus(500);
    })
  },

  removeFile: async (req, res, next) => {
    await fileService.updateFileIsRemoved(req.body.fileData, true)
    .then(fileData => {
      return res.send({ fileData });
    })
    .catch(err => {
      console.log(err)
      return res.sendStatus(500);
    }) 
  },

  recoverFile: async (req, res, next) => {
    await fileService.updateFileIsRemoved(req.body.fileData, false)
    .then(fileData => {
      return res.send({ fileData });
    })
    .catch(err => {
      console.log(err)
      return res.sendStatus(500);
    }) 
  },

  deleteFile: async (req, res, next) => {
    await fileService.deleteFile(req.file) 
    .then(async fileData => {
      await driveService.updateDriveUsedSpace(req.drive, -req.file.size) // req.file is used to prevent the file size spoofing
      .then(() => {
        fs.unlink('uploads/' + req.body.fileData.name + '.' + req.body.fileData.nameExtension, async (err) => {
          if (err) {
            console.log(err);
          }
        })
        fs.unlink('thumbnails/' + req.body.fileData.name + '.' + req.body.fileData.nameExtension, async (err) => {
          if (err) {
            console.log(err);
          }
        })
        return res.send({ fileData });
      })
    }) 
    .catch(err => {
      console.log(err)
      return res.sendStatus(500);
    }) 
  },

}

module.exports = fileController;
