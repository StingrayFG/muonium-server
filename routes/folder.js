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

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
      if (err) { return res.sendStatus(403); }   
      else if (user.uuid != req.body.userUuid) { return res.sendStatus(403); }   
      else { req.user = user; next(); } 
    });
  } else {
    return res.sendStatus(401);
  }
};

const checkDrive = async (req, res, next) => {
  console.log('checkDrive');
  await prisma.drive.findUnique({
    where: {
      uuid: req.body.driveUuid,
    }
  })
  .then(result => {
    req.drive = result;
    next();
  })
  .catch(() => {
    return res.sendStatus(404);
  })
};

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
      req.body.absolutePath = result.absolutePath;
      if (result) {
        next();
      }
    })
    .catch(() => {
      return res.sendStatus(404);
    })
  }
};

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
    }
  })
  .catch(() => {
    return res.sendStatus(404);
  })
};

// Endpoints
router.post('/folder/create', authenticateJWT, checkDrive, checkParentFolder, async function(req, res, next) {
  await prisma.folder.create({
    data: {
      name: req.body.folderName,
      uuid: crypto.randomUUID(),
      ownerUuid: req.user.uuid,
      parentUuid: req.body.parentUuid,
      driveUuid: req.body.driveUuid,
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

router.post('/folder/get/path', authenticateJWT, checkDrive, async function(req, res, next) {
  if (req.body.path === '/trash') {
    return res.send({ uuid: 'trash'});
  } else if (req.body.path === '/home') {
    return res.send({ uuid: 'home'});
  } else if ((req.body.path.slice(0, 6) !== '/trash') && (req.body.path.slice(0, 5) === '/home')) {
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

router.put('/folder/rename', authenticateJWT, checkDrive, checkFolder, async function(req, res, next) {
  modificationDate = Date.now();

  const getNewAbsolutePath = (oldParentAbsolutePath, newParentAbsolutePath, oldAbsolutePath) => {
    let newAbsolutePath = oldAbsolutePath;
    newAbsolutePath = newAbsolutePath.slice(oldParentAbsolutePath.length, oldAbsolutePath.length);
    newAbsolutePath = newParentAbsolutePath + newAbsolutePath;
    return newAbsolutePath;
  }

  let originalFolder;

  await prisma.folder.findUnique({
    where: {
      uuid: req.folder.uuid,
    },
  })
  .then(async result => {
    originalFolder = result;

    let oldAbsolutePath = result.absolutePath;
    let newAbsolutePath = oldAbsolutePath;
    newAbsolutePath = newAbsolutePath.slice(0, oldAbsolutePath.length - result.name.length);
    newAbsolutePath = newAbsolutePath + req.body.folderName;
    
    await prisma.folder.update({
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
      await prisma.folder.findMany({
        where: {
          NOT: {
            uuid: req.folder.uuid,
          },
          absolutePath: {
            startsWith: originalFolder.absolutePath,
          },
        },
      })
      .then(async result => {  
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
  })
  .catch(() => {
    return res.sendStatus(404);
  })
});

router.put('/folder/move', authenticateJWT, checkDrive, checkFolder, async function(req, res, next) {
  await prisma.folder.update({
    where: {
      uuid: req.folder.uuid,
    },
    data: {
      parentUuid: req.body.parentUuid,
    },
  })
  .then(() => {
    return res.sendStatus(200);
  })
  .catch(() => {
    return res.sendStatus(404);
  })
});

router.put('/folder/remove', authenticateJWT, checkDrive, checkFolder, async function(req, res, next) {
  await prisma.folder.update({
    where: {
      uuid: req.folder.uuid,
    },
    data: {
      isRemoved: true,
    },
  })
  .then(() => {
    return res.sendStatus(200);
  })
  .catch(() => {
    return res.sendStatus(404);
  })
});

router.put('/folder/recover', authenticateJWT, checkDrive, checkFolder, async function(req, res, next) {
  await prisma.folder.update({
    where: {
      uuid: req.folder.uuid,
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

router.post('/folder/delete', authenticateJWT, checkDrive, checkFolder, async function(req, res, next) {
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

        await prisma.drive.update({
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

  const deleteChildren = async () => {
    let deletedParentsUuids = [req.folder.uuid];
    let nextDeletedParentsUuids = [];

    while (deletedParentsUuids.length > 0) {
      await Promise.all([
        nextDeletedParentsUuids = await handleChildrenFolders(deletedParentsUuids),
        handleChildrenFiles(deletedParentsUuids)
      ])   
      .then(() => {
        deletedParentsUuids = nextDeletedParentsUuids;
      })
      .catch(() => {
        reject();
      })
    };
  };

  const deleteBookmark = async () => {
    try {
      await prisma.bookmark.delete({
        where: {
          ownerUuid_folderUuid: {
            ownerUuid: req.body.userUuid,
            folderUuid: req.body.folderUuid,
          },
        },
      })
      .then(e => {
        console.log(e)  
      })
    } catch { }
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
    deleteBookmark();
  })
  .then(() => {
    return res.sendStatus(200);     
  })
  .catch(() => {
    return res.sendStatus(404);
  })  
});
  
module.exports = router;