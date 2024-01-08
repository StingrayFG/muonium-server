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

const parseSize = async (req, res, next) => {
  req.body = req.params;
  req.file = { size: parseInt(req.headers['content-length']) };
  next();
}

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
  if ((req.body.parentUuid == 'root') || (req.body.parentUuid == 'trash')) {
    next();
  } else if (req.body.parentUuid) {
    await prisma.folder.findUnique({
      where: {
        uuid: req.body.parentUuid,
      }
    })
    .then(result => {
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
    }
  })
  .then(() => {
    return res.sendStatus(201);
  }) 
  .catch((e) => {
    console.log(e)
    return res.sendStatus(404);
  }) 
});

router.post('/folder/get', authenticateJWT, checkDrive, checkParentFolder, async function(req, res, next) {
  let folder = {files: [], folders: []};
  if (req.body.parentUuid === 'trash') {
    Promise.all([
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
      });
      return res.send(folder);
    }) 
    .catch(() => {
      return res.sendStatus(404);
    }) 
  } else {
    Promise.all([
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
      });
      return res.send(folder);
    })   
    .catch(() => {
      return res.sendStatus(404);
    }) 
  }
});

router.put('/folder/rename', authenticateJWT, checkDrive, checkFolder, async function(req, res, next) {
  modificationDate = Date.now();

  await prisma.folder.update({
    where: {
      uuid: req.folder.uuid,
    },
    data: {
      name: req.body.folderName + '.' + modificationDate,
      modificationDate: new Date(modificationDate),
    },
  })
  .then(() => {
    return res.sendStatus(200);
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
    return res.sendStatus(200)
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
    return res.sendStatus(200)
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
    return res.sendStatus(200)
  })
  .catch(() => {
    return res.sendStatus(404);
  })
});

router.delete('/folder/delete', authenticateJWT, checkDrive, checkParentFolder, checkFolder, async function(req, res, next) {
  try {
    await prisma.folder.delete({
      where: {
        uuid: req.body.folderUuid,
      },
    })
    .then(() => {
      deleteChildren();
      res.sendStatus(200);      
    })
  } catch (e) {
    res.sendStatus(404);
  }

  deleteChildren = async () => {
    let deletedParentUuids = [req.body.folderUuid];
    let nextDeletedParentUuids = [];

    while (deletedParentUuids.length > 0) {
      await Promise.all([
        async () => {
          let foldersToDelete = await prisma.folder.findMany({
            where: {
              parentUuid: {
                in: deletedParentUuids,
              }
            },
          })
          .then(async () => {
            nextDeletedParentUuids = [];
            foldersToDelete.forEach(element => {
              nextDeletedParentUuids.push(element.uuid);
            });

            await prisma.folder.deleteMany({
              where: {
                parentUuid: deletedParentUuids,
              },
            });
          })
        },

        async () => {
          let filesToDelete = await prisma.file.findMany({
            where: {
              parentUuid: {
                in: deletedParentUuids,
              }
            },
          })
          .then(async () => {
            let filesToDeleteSize;
            filesToDelete.forEach(element => {
              filesToDeleteSize += element.size;
            });

            await prisma.drive.update({
              where: {
                uuid: req.body.driveUuid,
              },
              data: {
                spaceUsed: { decrement: filesToDeleteSize },
              },
            })

            await prisma.file.deleteMany({
              where: {
                parentUuid: deletedParentUuids,
              },
            });
          })
        },

      ])   
      .then(
        deletedParentUuids = nextDeletedParentUuids
      )
    };
  };
});
  
module.exports = router;