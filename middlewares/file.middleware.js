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

  checkFile: async (req, res, next) => {
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
