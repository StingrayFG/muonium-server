const path = require('path');
const fs = require('fs');

const fileService = require('../services/file.service.js');
const folderService = require('../services/folder.service.js');
const bookmarkService = require('../services/bookmark.service.js');
const diskService = require('../services/disk.service.js')


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

    const getThumbnail = async (file) => {
      return new Promise(async function(resolve, reject) {
        const image = await fs.promises.readFile('thumbnails/' + file.name + '.' + file.nameExtension, { encoding: 'base64' });
        file.thumbnail = image;
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
              return await getThumbnail(file);
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
    .then(async () => {
      const recalculatedSize = folderWithChildren.folders.length + folderWithChildren.files.length;

      if (folderWithChildren.size !== recalculatedSize) {
        await folderService.updateFolderSize({
          ...folderWithChildren,
          size: folderWithChildren.folders.length + folderWithChildren.files.length
        })
        return res.send({ folderData: { ...folderWithChildren, size: recalculatedSize } });
      } else {
        return res.send({ folderData: folderWithChildren });
      }
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
    .then(async folderData => {
      await folderService.incrementFolderSize({ uuid: req.parentFolder.uuid });
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
        .then(async () => {
          await folderService.decrementFolderSize({ uuid: req.folder.parentUuid });
          await folderService.incrementFolderSize({ uuid: req.body.folderData.uuid });
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
    await folderService.updateFolderIsRemoved({ ...req.body.folderData, isRemoved: true })
    .then(async folderData => {
      await folderService.decrementFolderSize({ uuid: req.body.folderData.parentUuid });
      return res.send({ folderData });
    }) 
    .catch(err => {
      console.log(err)
      return res.sendStatus(500);
    })
  },

  recoverFolder: async (req, res, next) => {
    await folderService.updateFolderIsRemoved({ ...req.body.folderData, isRemoved: false })
    .then(async folderData => {
      await folderService.incrementFolderSize({ uuid: req.body.folderData.parentUuid });
      return res.send({ folderData });
    }) 
    .catch(err => {
      console.log(err)
      return res.sendStatus(500);
    })
  },

  deleteFolder: async (req, res, next) => {
    let foldersToDeleteUuids = [req.folder.uuid];

    const findChildren = async (parentFolder) => {
      return new Promise(async function(resolve, reject) {
        await folderService.getFoldersByParent(parentFolder, req.body.driveData)
        .then(async folders => {
          if (folders.length > 0) {
            await Promise.allSettled(
              folders.map(async folder => {
                await findChildren(folder);
              })
            )
          }
          foldersToDeleteUuids = [...foldersToDeleteUuids, ...folders.map(childFolder => childFolder.uuid)];       
          resolve();
        })
        .catch(err => {
          console.log(err);
          resolve();
        })
      })
    }

    const deleteFiles = async () => {
      return new Promise(async function(resolve, reject) {
        await fileService.getFilesByParentUuids(foldersToDeleteUuids)
        .then(async files => {
          await fileService.deleteFilesByParentUuids(foldersToDeleteUuids)
          .then(async () => {
            await Promise.allSettled(
              files.map(async file => {
                return await diskService.deleteFileOnDisk(file);
              })
            )
            resolve(); 
          })
        })
        .catch(err => {
          reject(err);
        })
      })
    }

    await findChildren(req.folder)
    .then(async () => {
      await Promise.allSettled([
        await bookmarkService.deleteBookmarksByFoldersUuids(req.user, foldersToDeleteUuids),
        await folderService.deleteFoldersByFoldersUuids(foldersToDeleteUuids),
        await deleteFiles()
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
