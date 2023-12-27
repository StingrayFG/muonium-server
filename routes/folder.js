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
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

const checkDrive = async (req, res, next) => {
  try {
    const drive = await prisma.drive.findUnique({
      where: {
        uuid: req.body.driveUuid,
      }
    })
    .then(() => {
      if (drive) {
        req.drive = drive;
        next(); 
      }
    })
  } catch (e) {
    res.sendStatus(404);
  }
};

const checkParentFolder = async (req, res, next) => {
  try {
    if ((req.body.parentUuid == '/root') || (req.body.parentUuid == '/trash')) {
      next();
    } else if (req.body.parentUuid) {
      const folder = await prisma.folder.findUnique({
        where: {
          uuid: req.body.parentUuid,
        }
      })
      .then(() => {
          if (folder) {
            next();
          }
        }
      )
    }
  } catch (e) {
    res.sendStatus(404);
  }
};

const checkFolder = async (req, res, next) => {
  try {
    const file = await prisma.folder.findUnique({
      where: {
        uuid: req.body.fileUuid,
      }
    })
    .then(() => {
        if (file) {
          req.body.file = file;
          next();
        }
      }
    )
  } catch (e) {
    res.sendStatus(404);
  }
};

// Endpoints
router.post('/folder/create', authenticateJWT, checkDrive, checkParentFolder, checkFolder, async function(req, res, next) {
  try {
    await prisma.folder.create({
      data: {
        name: req.file.folderName,
        uuid: Buffer.from(crypto.randomUUID(), 'hex'),
        ownerUuid: req.user.uuid,
        parentUuid: req.body.parentUuid,
        driveUuid: req.body.driveUuid,
      }
    })
    .then(
      res.sendStatus(201),
    )  
  } catch (e) {
    res.sendStatus(404);
  }
});

router.put('/folder/rename', authenticateJWT, checkDrive, checkParentFolder, checkFolder, async function(req, res, next) {
  try {
    await prisma.folder.update({
      where: {
        uuid: req.body.folderUuid,
      },
      data: {
        name: req.body.folderName,
      },
    })
    .then(
      res.sendStatus(200),
    )
  } catch (e) {
    res.sendStatus(404);
  }
});

router.put('/folder/move', authenticateJWT, checkDrive, checkParentFolder, checkFolder, async function(req, res, next) {
  try {
    await prisma.folder.findUnique({
      where: {
        uuid: req.body.folderUuid,
      }
    })
    .then(
      await prisma.file.update({
        where: {
          uuid: req.body.folderUuid,
        },
        data: {
          name: req.body.newParentUuid,
        },
      })
      .then(
        res.sendStatus(200),
      )
    )

  } catch (e) {
    res.sendStatus(404);
  }
});

router.delete('/folder/delete', authenticateJWT, checkDrive, checkParentFolder, checkFolder, async function(req, res, next) {
  try {
    await prisma.folder.delete({
      where: {
        uuid: req.body.folderUuid,
      },
    })
    .then(async () => {
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
      Promise.all([
        async () => {
            let foldersToDelete = await prisma.folder.findMany({
            where: {
              parentUuid: deletedParentUuids,
            },
          })
          .then(() => {
            foldersToDelete.forEach(element => {
              nextDeletedParentUuids.push(element.uuid)
            });
            deletedParentUuids = nextDeletedParentUuids;
          })
        },
  
        await prisma.folder.deleteMany({
          where: {
            parentUuid: deletedParentUuids,
          },
        }),
  
        await prisma.folder.deleteMany({
          where: {
            parentUuid: deletedParentUuids,
          },
        })

      ])   
    };
  };

});
  
module.exports = router;