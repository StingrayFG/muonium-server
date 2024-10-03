const path = require('path');
const fs = require('fs');

const fileService = require('../services/file.service.js');
const folderService = require('../services/folder.service.js');
const bookmarkService = require('../services/bookmark.service.js');


const folderController = {

  getFolderWithChildren: async (req, res, next) => {
    let folderWithChildren = { ...req.folder };

    let foldersSearchFunction;
    let filesSearchFunction;
    
    if (req.body.folderData.uuid === 'trash') {
      foldersSearchFunction = () => folderService.getRemovedFolders(req.drive);
      filesSearchFunction = () => fileService.getRemovedFiles(req.drive);
    } else {
      foldersSearchFunction = () => folderService.getFoldersByParent(req.folder, req.drive);
      filesSearchFunction = () => fileService.getFilesByParent(req.folder, req.drive);
    }

    const getThumbnail = (file) => {
      return new Promise(async function(resolve, reject) {
        const image = await fs.promises.readFile('thumbnails/' + file.name + '.' + file.nameExtension, { encoding: 'base64' });
        file.thumbnail = image
        resolve(file);
      })
    }

    await Promise.allSettled([
      await foldersSearchFunction()
      .then(folders => {
        folderWithChildren.folders = folders.map(folder => ({ ...folder, type: 'folder' }))
      })
      .catch(() => {
        folderWithChildren.folders = [];
      }),

      await filesSearchFunction()
      .then(async files => {      
        await Promise.allSettled(
          files.map(async file => {
            const extension = path.parse(file.name).ext.substring(1);
            if (['png', 'webp', 'jpg', 'jpeg'].includes(extension)) {
              return getThumbnail(file);
            } else {
              return file;
            }         
          })
        )
        folderWithChildren.files = files.map(file => ({ ...file, type: 'file' }))
      })
      .catch(() => {
        folderWithChildren.files = [];
      })
    ])
    .then(() => {
      return res.send({ folderData: folderWithChildren });
    })
    .catch(err => {
      console.log(err)
      return res.sendStatus(500);
    }) 
  },

  createFolder: async (req, res, next) => {
    await folderService.createFolder({
      name: req.body.folderData.name,

      ownerUuid: req.user.uuid,
      driveUuid: req.drive.uuid,
      parentUuid: req.parentFolder.uuid,

      absolutePath: req.parentFolder.absolutePath + '/' + req.body.folderData.name, 
    })
    .then(folderData => {
      return res.send({ folderData });
    }) 
    .catch(err => {
      console.log(err)
      return res.sendStatus(500);
    }) 
  },

  renameFolder: async function(req, res, next) {
    const modificationDate = Date.now();

    const originalFolder = req.folder;
    req.body.folderData.absolutePath = req.parentFolder.absolutePath + '/' + req.body.folderData.name;
    req.body.folderData.modificationDate = new Date(modificationDate); 


    const getNewAbsolutePath = (childFolder) => {
      return req.body.folderData.absolutePath + childFolder.absolutePath.slice(originalFolder.absolutePath.length, childFolder.absolutePath.length);
    }
    
    await folderService.updateFolderNameAndPath(req.body.folderData)
    .then(async folderData => {
      await folderService.getFoldersByPathBeginning(req.folder, req.drive)
      .then(async folders => {
        folders = folders.map(childFolder => ({ ...childFolder, absolutePath: getNewAbsolutePath(childFolder) }))

        await Promise.allSettled(
          folders.map(async folder => {
            return await folderService.updateFolderPath(folder);
          })
        )
        .then(() => {
          return res.send({ folderData });
        })
      })
    })    
    .catch(err => {
      console.log(err)
      return res.sendStatus(500);
    }) 
  },

  moveFolder: async function(req, res, next) {
    const originalFolder = req.folder;
    req.body.folderData.absolutePath = req.parentFolder.absolutePath + '/' + req.body.folderData.name;

    const getNewAbsolutePath = (childFolder) => {
      return req.body.folderData.absolutePath + childFolder.absolutePath.slice(originalFolder.absolutePath.length, childFolder.absolutePath.length);
    }
    
    await folderService.updateFolderParentAndPath(req.body.folderData)
    .then(async folderData => {
      await folderService.getFoldersByPathBeginning(req.folder, req.drive)
      .then(async folders => {
        folders = folders.map(childFolder => ({ ...childFolder, absolutePath: getNewAbsolutePath(childFolder) }))

        await Promise.allSettled(
          folders.map(async folder => {
            return await folderService.updateFolderPath(folder);
          })
        )
        .then(() => {
          return res.send({ folderData });
        })
      })
    })    
    .catch(err => {
      console.log(err)
      return res.sendStatus(500);
    }) 
  },

  removeFolder: async (req, res, next) => {
    await folderService.updateFolderIsRemoved(req.body.folderData, true)
    .then(folderData => {
      return res.send({ folderData });
    }) 
    .catch(err => {
      console.log(err)
      return res.sendStatus(500);
    })
  },

  recoverFolder: async (req, res, next) => {
    await folderService.updateFolderIsRemoved(req.body.folderData, false)
    .then(folderData => {
      return res.send({ folderData });
    }) 
    .catch(err => {
      console.log(err)
      return res.sendStatus(500);
    })
  },

  deleteFolder: async (req, res, next) => {
    const foldersToDeleteUuids = [req.body.folderData.uuid];

    const findChildren = async (folder) => {
      return new Promise(async function(resolve, reject) {
        await folderService.getFoldersByParent(req.body.folderData)
        .then(async folders => {
          if (folders.length > 0) {
            await Promise.allSettled(
              folders.map(async folder => {
                await findChildren(folder);
              })
            )
          }
          foldersToDeleteUuids.concat(folders.map((childFolder) => ( childFolder.uuid )));       
          resolve();
        })
        .catch(err => {
          console.log(err);
          resolve();
        })
      })
    }

    await findChildren(req.user, foldersToDeleteUuids)
    .then(async () => {
      console.log(foldersToDeleteUuids)
      await Promise.allSettled([
        await bookmarkService.deleteBookmarksByFoldersUuids(req.user, foldersToDeleteUuids),
        await fileService.deleteFilesByFoldersUuids(foldersToDeleteUuids),
        await folderService.deleteFoldersByFoldersUuids(foldersToDeleteUuids)
      ])
      .then(() => {
        return res.send({ folderData: req.folder });
      })
    })
    .catch(err => {
      console.log(err);
      return res.sendStatus(500);
    })
  }
}

module.exports = folderController;
