var path = require('path');
var fs = require('fs');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');

var express = require('express');
var router = express.Router();

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

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

const checkUUIDs = async (req, res, next) => {
  try {
    let drive;
    let folder;
    await Promise.all([
      drive = await prisma.drive.findUnique({
        where: {
          uuid: req.body.driveUuid
        }
      }),
      async () => {
        if (req.body.parentUuid) {
          folder = await prisma.folder.findUnique({
            where: {
              uuid: req.body.parentUuid
            }
          })
        }
      }
    ])
    .then(() => {
      if ((drive && folder) || (drive && !req.body.parentUuid)) { 
        req.drive = drive;
        next(); 
      } else { 
        res.sendStatus(404); 
      }
    })
  } catch (e) {
    res.sendStatus(500);
  }
};

const checkDriveSpace = async (req, res, next) => {
  if ((req.drive.spaceUsed + req.file.size) < drive.spaceTotal) {
    next();
  } else {
    res.sendStatus(500);
  }
};

router.post('/file/upload', authenticateJWT, checkUUIDs, checkDriveSpace, upload.single('file'), async function(req, res, next) {
  try {
    let fileUuid = Buffer.from(crypto.randomUUID(), 'hex');
    await Promise.all([
      prisma.file.create({
        data: {
          name: req.file.filename,
          uuid: fileUuid,
          ownerUuid: req.user.uuid,
          parentUuid: req.body.parentUuid,
          driveUuid: req.body.driveUuid,
        }
      }),

      prisma.drive.update({
        where: {
          uuid: req.body.driveUuid,
        },
        data: {
          spaceUsed: { increment: req.file.size },
        },
      })
    ])
    .then(
      res.sendStatus(201),
    )
  } catch (e) {
    res.sendStatus(409);
  }
});


router.put('/file/rename', authenticateJWT, checkUUIDs, async function(req, res, next) {
  try {
    prisma.file.update({
      where: {
        uuid: req.body.fileUuid,
      },
      data: {
        name: req.body.fileName,
      },
    })
    .then(
      res.sendStatus(200),
    )
  } catch (e) {
    res.sendStatus(404);
  }
});


router.put('/file/remove', authenticateJWT, checkUUIDs, async function(req, res, next) {
  try {
    prisma.drive.update({
      where: {
        uuid: req.body.fileUuid,
      },
      data: {
        removed: true,
      },
    })
    .then(
      res.sendStatus(200),
    )
  } catch (e) {
    res.sendStatus(404);
  }
});

router.delete('/file/delete', authenticateJWT, checkUUIDs, async function(req, res, next) {
  try {
    prisma.drive.update({
      where: {
        uuid: req.body.fileUuid,
      },
      data: {
        removed: true,
      },
    })
    .then(
      res.sendStatus(200),
    )
  } catch (e) {
    res.sendStatus(404);
  }
});
  
  