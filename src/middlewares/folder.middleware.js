const folderService = require('../services/folder.service.js')


const folderMiddleware = {

  checkIfNameIsUsed: async (req, res, next) => {
    await folderService.checkIfNameIsAlreadyUsed(req.body.folderData)
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

  checkFolderUuid: async (req, res, next) => {
    if (req.body.folderData.uuid === 'home') {
      req.folder = { uuid: 'home', absolutePath: '/home'}
      next();
    } else if (req.body.folderData.uuid === 'trash') {
      req.folder = { uuid: 'trash', absolutePath: '/trash'}
      next();
    } else if (req.body.folderData.uuid ) {
      await folderService.getFolderByUuid(req.body.folderData)
      .then(folder => {
        if (folder) {
          req.folder = folder;
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
      return res.sendStatus(404);
    }
  },

  checkFolderPath: async (req, res, next) => {
    if (req.body.folderData.absolutePath === '/home') {
      req.folder = { uuid: 'home', absolutePath: '/home'}
      next();
    } else if (req.body.folderData.uuid === 'trash') {
      req.folder = { uuid: 'trash', absolutePath: '/trash'}
      next();
    } else if (req.body.folderData.absolutePath ) {
      await folderService.getFolderByPath(req.body.folderData, req.drive)
      .then(folder => {
        if (folder) {
          req.folder = folder;
          next();
        } else {
          return res.sendStatus(404);
        }
      })
      .catch(err => {
        console.log(err);
        return res.sendStatus(500);
      })
    }
  },

  checkParentFolder: async (req, res, next) => {
    if (req.body.folderData.parentUuid === 'home') {
      req.parentFolder = { uuid: req.body.folderData.parentUuid, absolutePath: '/home'}
      next();
    } else if (req.body.folderData.parentUuid === 'trash') {
      req.parentFolder = { uuid: req.body.folderData.parentUuid, absolutePath: '/trash'}
      next();
    } else if (req.body.folderData.parentUuid ) {
      await folderService.getParentFolder(req.body.folderData)
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


module.exports = folderMiddleware;
