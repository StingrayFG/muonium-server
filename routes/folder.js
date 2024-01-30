var path = require('path');
var fs = require('fs');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');

var express = require('express');
var router = express.Router();

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Middleware
var multer = require('multer');
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname + '.' + Date.now())  
  }
})
var upload = multer({ storage: storage });

// check JWT in Authorization header
const authenticateJWT = (req, res, next) => { 
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
      if (err) { 
        return res.sendStatus(403); 
      } else if (user.uuid != req.body.userUuid) { 
        return res.sendStatus(403); 
      } else { 
        req.user = user; 
        next();
      } 
    });
  } else {
    return res.sendStatus(401);
  }
};

// Check whether a drive with uuid specified in request exists
const checkDrive = async (req, res, next) => { 
  console.log('checkDrive');
  await prisma.drive.findUnique({
    where: {
      uuid: req.body.driveUuid,
    }
  })
  .then(result => {
    if (result) {
      req.drive = result;
      next();
    } else {
      return res.sendStatus(404);
    }
  })
  .catch(() => {
    return res.sendStatus(404);
  })
};

// Check whether a parent folder with uuid specified in request exists
const checkParentFolder = async (req, res, next) => {
  console.log('checkParentFolder');
  if (req.body.parentUuid == 'home') {
    req.body.absolutePath = '/home'
    next();
  } else if (req.body.parentUuid == 'trash') {
    req.body.absolutePath = '/trash'
    next();
  } else if (req.body.parentUuid) {
    await prisma.folder.findUnique({
      where: {
        uuid: req.body.parentUuid,
      }
    })
    .then(result => {
      if (result) {
        req.body.absolutePath = result.absolutePath;
        next();
      } else {
        return res.sendStatus(404);
      }
    })
    .catch(() => {
      return res.sendStatus(404);
    })
  }
};

// Check whether the edited folder with uuid specified in request exists. If it does, save it's data to request
const checkFolder = async (req, res, next) => { 
  console.log('checkFolder');
  await prisma.folder.findUnique({
    where: {
      uuid: req.body.folderUuid,
    }
  })
  .then(result => {
    if (result) {
      req.folder = result;
      next();
    } else {
      return res.sendStatus(404);
    }
  })
  .catch(() => {
    return res.sendStatus(404);
  })
};

// Endpoints
// Create a new folder with given name
router.post('/folder/create', authenticateJWT, checkDrive, checkParentFolder, async function(req, res, next) {
  await prisma.folder.create({
    data: {
      name: req.body.folderName,
      uuid: crypto.randomUUID(),
      ownerUuid: req.user.uuid,
      parentUuid: req.body.parentUuid,
      driveUuid: req.body.driveUuid,
      // Get the absolute path of a newly created folder based on its parent path
      absolutePath: req.body.absolutePath + '/' + req.body.folderName, 
    }
  })
  .then(() => {
    return res.sendStatus(201);
  }) 
  .catch(() => {
    return res.sendStatus(404);
  }) 
});

router.post('/folder/get/uuid', authenticateJWT, checkDrive, checkParentFolder, async function(req, res, next) {
  let folder = { files: [], folders: [], uuid: req.body.parentUuid, absolutePath: req.body.absolutePath };
  if (req.body.parentUuid === 'trash') {
    await Promise.all([
      folder.files = await prisma.file.findMany({
        orderBy: [
          {
            name: 'asc',
          },
        ],
        where: {
          ownerUuid: req.body.userUuid,
          isRemoved: true,
        },
      }),
      folder.folders = await prisma.folder.findMany({
        orderBy: [
          {
            name: 'asc',
          },
        ],
        where: {
          ownerUuid: req.body.userUuid,
          isRemoved: true,
        },
      }),
    ])
    .then(() => {
      folder.files.forEach(file => {
        file.name = path.parse(file.name).name;
        file.type = 'file';
      });
      folder.folders.forEach(folder => {
        folder.type = 'folder';
      });
      return res.send(folder);
    }) 
    .catch(() => {
      return res.sendStatus(404);
    }) 
  } else if (req.body.parentUuid) {
    await Promise.all([
      folder.files = await prisma.file.findMany({
        orderBy: [
          {
            name: 'asc',
          },
        ],
        where: {
          parentUuid: req.body.parentUuid,
          ownerUuid: req.body.userUuid,
          isRemoved: false,
        },
      }),
      folder.folders = await prisma.folder.findMany({
        orderBy: [
          {
            name: 'asc',
          },
        ],
        where: {
          parentUuid: req.body.parentUuid,
          ownerUuid: req.body.userUuid,
          isRemoved: false,
        },
      }),
    ])
    .then(() => {
      folder.files.forEach(file => {
        file.name = path.parse(file.name).name;
        file.type = 'file';
      });
      folder.folders.forEach(folder => {
        folder.type = 'folder';
      });
      return res.send(folder);
    })   
    .catch(() => {
      return res.sendStatus(404);
    }) 
  } else {
    return res.sendStatus(404);
  }
});

// Get the folder uuid based on the requested path
router.post('/folder/get/path', authenticateJWT, checkDrive, async function(req, res, next) {
  // Check whether path in request is correct (starts with '/home') or not 
  // (traversing folders in trash is prohibited, so only exact '/trash' path is acceptable)
  if (req.body.path === '/trash') {
    return res.send({ uuid: 'trash'});
  } else if (req.body.path === '/home') {
    return res.send({ uuid: 'home'});
  } else if ((req.body.path.slice(0, 6) !== '/trash') && (req.body.path.slice(0, 5) === '/home')) {
    // Find a folder with the given absolute path, return it's uuid if it exists
    await prisma.folder.findFirst({ 
      where: {
        ownerUuid: req.body.userUuid,
        absolutePath: req.body.path,
      },
    })
    .then(async result => {
      return res.send({ uuid: result.uuid });
    })
    .catch(() => {
      return res.sendStatus(404);
    }) 
  } else {
    return res.sendStatus(404);
  }
  
});

// Rename folder with the given uuid
router.put('/folder/rename', authenticateJWT, checkDrive, checkFolder, async function(req, res, next) {
  modificationDate = Date.now();

  // A function used to update children's absolute path. 
  // Simply replaces the beginning of the passed child's absolute path with the new path of the renamed folder
  const getNewAbsolutePath = (oldParentAbsolutePath, newParentAbsolutePath, oldAbsolutePath) => {
    return newParentAbsolutePath + oldAbsolutePath.slice(oldParentAbsolutePath.length, oldAbsolutePath.length);
  }

  let oldAbsolutePath = req.folder.absolutePath;
  let newAbsolutePath = oldAbsolutePath.slice(0, oldAbsolutePath.length - req.folder.name.length) + req.body.folderName;
  
  await prisma.folder.update({ // Update the renamed folder's data in the database
    where: {
      uuid: req.folder.uuid,
    },
    data: {
      name: req.body.folderName,
      modificationDate: new Date(modificationDate),
      absolutePath: newAbsolutePath,
    },
  })
  .then(async () => {
    await prisma.folder.findMany({ // Find all the children of the renamed folder
      where: {
        ownerUuid: req.body.userUuid,
        NOT: {
          uuid: req.folder.uuid,
        },
        absolutePath: {
          startsWith: oldAbsolutePath,
        },
      },
    })
    .then(async result => { // Update absolute paths of all the children of the renamed folder
      for await (let folder of result) {
        folder.absolutePath = getNewAbsolutePath(oldAbsolutePath, newAbsolutePath, folder.absolutePath);

        await prisma.folder.update({
          where: {
            uuid: folder.uuid,
          },
          data: {
            absolutePath: folder.absolutePath,
          }
        })
      }
    })
    .then(() => {
      return res.sendStatus(200);
    })
    .catch((e) => {
      return res.sendStatus(404);
    })    
  })
  .catch(() => {
    return res.sendStatus(404);
  })
});

// Move folder with the given uuid to be inside the specified parentUuid
router.put('/folder/move', authenticateJWT, checkDrive, checkFolder, async function(req, res, next) {
  modificationDate = Date.now();

  // A function used to update children's absolute path. 
  // Simply replaces the beginning of the passed child's absolute path with the new path of the renamed folder
  const getNewAbsolutePath = (oldParentAbsolutePath, newParentAbsolutePath, oldAbsolutePath) => {
    return newParentAbsolutePath + oldAbsolutePath.slice(oldParentAbsolutePath.length, oldAbsolutePath.length);
  }

  // A function to get the destination parent folder. 
  // The destination parent folder is used to update absolute paths of the moved folder & it's children
  const getNewParentFolder = async () => {
    return new Promise( async function(resolve, reject) { 
      if (req.body.parentUuid === 'home') {
        resolve({ uuid: 'home', absolutePath: '/home' });
      } else {
        return await prisma.folder.findUnique({ // Find the destination parent folder
          where: {
            uuid: req.body.parentUuid,
          },
        })
        .then(result => {
          resolve(result);
        })
        .catch(() => {
          reject();
        })
      }
    })
    .catch(() => {
      reject();
    })
  }

  await getNewParentFolder()
  .then(async result => {
    let oldAbsolutePath = req.folder.absolutePath;
    let newAbsolutePath = result.absolutePath + '/' + req.folder.name;
    
    await prisma.folder.update({ // Update the renamed folder's data in the database
      where: {
        uuid: req.folder.uuid,
      },
      data: {
        parentUuid: result.uuid,
        absolutePath: newAbsolutePath,
        modificationDate: new Date(modificationDate),
      },
    })
    .then(async () => {
      await prisma.folder.findMany({ // Find all the children of the renamed folder
        where: {
          ownerUuid: req.body.userUuid,
          NOT: {
            uuid: req.folder.uuid,
          },
          absolutePath: {
            startsWith: oldAbsolutePath,
          },
        },
      })
      .then(async result => { // Update absolute paths of all the children of the renamed folder
        for await (let folder of result) {
          folder.absolutePath = getNewAbsolutePath(oldAbsolutePath, newAbsolutePath, folder.absolutePath);
          await prisma.folder.update({
            where: {
              uuid: folder.uuid,
            },
            data: {
              absolutePath: folder.absolutePath,
            }
          })
        }
      })
      .then(() => {
        return res.sendStatus(200);
      })
      .catch((e) => {console.log(e)
        return res.sendStatus(404);
      })
    })
    .catch((e) => {console.log(e)
      return res.sendStatus(404);
    })
  })
});

// Set folder with the given uuid and all it's children's field 'isRemoved' to true
router.put('/folder/remove', authenticateJWT, checkDrive, checkFolder, async function(req, res, next) {
  await prisma.folder.updateMany({
    where: {
      absolutePath: {
        startsWith: req.folder.absolutePath,
      },
    },
    data: {
      isRemoved: true,
    }
  })
  .then(() => {
    return res.sendStatus(200);
  })
  .catch(() => {
    return res.sendStatus(404);
  })
});

// Set folder with the given uuid and all it's children's field 'isRemoved' to false
router.put('/folder/recover', authenticateJWT, checkDrive, checkFolder, async function(req, res, next) {
  await prisma.folder.update({
    where: {
      absolutePath: {
        startsWith: req.folder.absolutePath,
      },
    },
    data: {
      isRemoved: false,
    },
  })
  .then(() => {
    return res.sendStatus(200);
  })
  .catch(() => {
    return res.sendStatus(404);
  })
});

// Delete folder with the given uuid and all it's children
// 1. Save the uuid of the given folder to deletedParentsUuids
// 2. Find the folders with the parentUuid included in deletedParentsUuids
// 3. Add uuids of these folders to nextDeletedParentsUuids
// 4. Delete the files and folders with parentUuids included in deletedParentsUuids. Update the used drive space while deleting files
// 5. Save nextDeletedParentsUuids to deletedParentsUuids.
// 6. Repeat by returning to 2.
router.post('/folder/delete', authenticateJWT, checkDrive, checkFolder, async function(req, res, next) {

  // Delete a file from disk
  const deleteFile = async (file) => {
    fs.unlink('uploads/' + file.name, async (err) => {
      if (err) {
        return res.sendStatus(404);
      } else {  
        await prisma.file.delete({
          where: {
            uuid: file.uuid,
          },
        })
      }
    });
  }

  // Delete files with the given parent uuids and update drive's used space
  const handleChildrenFiles = async (deletedParentsUuids) => { 
    return new Promise( async function(resolve, reject) {
      await prisma.file.findMany({
        where: {
          parentUuid: {
            in: deletedParentsUuids,
          }
        },
      })
      .then(async filesToDelete => {
        let filesToDeleteSize = 0;
        filesToDelete.forEach(file => {
          filesToDeleteSize += file.size;
          deleteFile(file);
        });

        await prisma.drive.update({ // Update the used drive space
          where: {
            uuid: req.body.driveUuid,
          },
          data: {
            spaceUsed: { decrement: filesToDeleteSize },
          },
        })
        .then(() => {
          resolve();
        })
        .catch(() => {
          reject();
        })
      })
      .catch(() => {
        reject();
      })
    })
  }

  // Delete folders with the given parent uuids, return their uuids as the new parent uuids
  const handleChildrenFolders = async (deletedParentsUuids) => {
    return new Promise( async function(resolve, reject) {
      nextDeletedParentsUuids = [];

      await prisma.folder.findMany({
        where: {
          parentUuid: {
            in: deletedParentsUuids,
          }
        },
      })
      .then(async foldersToDelete  => {   
        nextDeletedParentsUuids = foldersToDelete.map(f => f.uuid);

        await prisma.folder.deleteMany({
          where: {
            parentUuid: {
              in: deletedParentsUuids,
            }
          },
        })
        .then(() => {
          resolve(nextDeletedParentsUuids);
        })
        .catch(() => {
          reject();
        })
      })
      .catch(() => {
        reject();
      })
    })
  }

  // Delete the deleted folder's bookmark
  const deleteBookmarks = async (deletedParentsUuids) => {
    for await (let uuid of deletedParentsUuids) { 
      try {
        await prisma.bookmark.delete({
          where: {
            ownerUuid_folderUuid: {
              ownerUuid: req.body.userUuid,
              folderUuid: uuid,
            },
          },
        })
        .then(e => {
          console.log(e)  
        })
      } catch { }
    }
  };  

  // Delete children, get new deletedParentUuids
  const deleteChildren = async () => {
    let deletedParentsUuids = [req.folder.uuid];
    let nextDeletedParentsUuids = [];

    while (deletedParentsUuids.length > 0) {
      await Promise.all([
        nextDeletedParentsUuids = await handleChildrenFolders(deletedParentsUuids),
        handleChildrenFiles(deletedParentsUuids),
        deleteBookmarks(deletedParentsUuids),
      ])   
      .then(() => {
        deletedParentsUuids = nextDeletedParentsUuids;
      })
      .catch(() => {
        reject();
      })
    };
  };
  
  await prisma.folder.delete({
    where: {
      uuid: req.folder.uuid,
    },
  })
  .then(() => {
    deleteChildren();
  })
  .then(() => {
    return res.sendStatus(200);     
  })
  .catch(() => {
    return res.sendStatus(404);
  })  
});
  
module.exports = router;