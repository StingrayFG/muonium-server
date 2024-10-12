const fs = require('fs');

const fileService = require('../services/file.service.js')
const folderService = require('../services/folder.service.js')


const fileMiddleware = {
  parseBodyPreUpload: async (req, res, next) => {
    req.body = {
      userData: { uuid: req.params.userUuid },
      fileData: { parentUuid: req.params.parentUuid },
      driveData: { uuid: req.params.driveUuid },
    };
    next();
  },

  parseBodyPostUpload: async (req, res, next) => {
    req.body.fileData = {
      name: req.file.originalname,
      nameExtension: req.file.nameExtension + '',
      size: req.file.size,

      ownerUuid: req.params.userUuid,
      parentUuid: req.params.parentUuid,
      driveUuid: req.params.driveUuid,
    }
    next();
  },

  checkIfNameIsUsed: async (req, res, next) => {
    await fileService.checkIfNameIsAlreadyUsed(req.body.fileData)
    .then(isUsed => {
      if (isUsed) {
        return res.sendStatus(409);
      } else {
        next();
      }
    })
    .catch(err => {
      console.log(err);
      return res.sendStatus(500);
    })
  },

  checkIfNameIsUsedPostUpload: async (req, res, next) => {
    await fileService.checkIfNameIsAlreadyUsed(req.body.fileData)
    .then(isUsed => {
      if (isUsed) {
        fs.unlink(req.file.path, async (err) => {
          if (err) {
            console.log(err);
          }
        })
        fs.unlink('thumbnails/' + req.file.filename, async (err) => {
          if (err) {
            console.log(err);
          }
        })
        return res.sendStatus(409);
      } else {
        next();
      }
    })
    .catch(err => {
      console.log(err);
      return res.sendStatus(500);
    })
  },


  checkFile: async (req, res, next) => {
    if (req.body.fileData) {
      await fileService.getFile(req.body.fileData)
      .then(file => {
        if (file) {
          req.file = file;
          next();
        } else {
          return res.sendStatus(404);
        }
      })
      .catch(err => {
        console.log(err);
        return res.sendStatus(500);
      })
    } else {
      return res.sendStatus(400);
    }
  },

  checkParentFolder: async (req, res, next) => {
    if (req.body.fileData.parentUuid == 'home') {
      req.parentFolder = { uuid: req.body.fileData.parentUuid, absolutePath: '/home'}
      next();
    } else if (req.body.fileData.parentUuid == 'trash') {
      req.parentFolder = { uuid: req.body.fileData.parentUuid, absolutePath: '/trash'}
      next();
    } else if (req.body.fileData.parentUuid ) {
      await folderService.getParentFolder(req.body.fileData)
      .then(folder => {
        if (folder) {
          req.parentFolder = folder;
          next();
        } else {
          return res.sendStatus(400);
        }
      })
      .catch(err => {
        console.log(err);
        return res.sendStatus(500);
      })
    }
  }
}


module.exports = fileMiddleware;
