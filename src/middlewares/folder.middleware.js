const folderService = require('../services/folder.service.js')


const folderMiddleware = {
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