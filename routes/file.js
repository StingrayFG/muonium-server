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
        uuid: req.body.driveUuid
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

const checkDriveSpace = async (req, res, next) => {
  if ((req.drive.spaceUsed + req.file.size) < drive.spaceTotal) {
    next();
  } else {
    res.sendStatus(404);
  }
};

const checkFolder = async (req, res, next) => {
  try {
    if ((req.body.parentUuid == '/root') || (req.body.parentUuid == '/trash')) {
      next();
    } else if (req.body.parentUuid) {
      const folder = await prisma.folder.findUnique({
        where: {
          uuid: req.body.parentUuid
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

// Endpoints
router.post('/file/upload', authenticateJWT, checkDrive, checkDriveSpace, checkFolder, upload.single('file'), async function(req, res, next) {
  try {
    await prisma.file.create({
      data: {
        name: req.file.filename,
        uuid: Buffer.from(crypto.randomUUID(), 'hex'),
        size: req.file.size,
        ownerUuid: req.user.uuid,
        parentUuid: req.body.parentUuid,
        driveUuid: req.body.driveUuid,
      }
    })
    .then(
      await prisma.drive.update({
        where: {
          uuid: req.body.driveUuid,
        },
        data: {
          spaceUsed: { increment: req.file.size },
        },
      })
      .then(
        res.sendStatus(201),
      )
    )  
  } catch (e) {
    res.sendStatus(404);
  }
});

router.get('/file/download/:uuid', async function(req, res, next) {
  try {
    const file = await prisma.file.findUnique({
      where: {
        uuid: req.params.uuid,
      }
    })
    .then(() => {
      if (file) {
        res.set('Content-Disposition', `attachment; filename="${path.parse(file.name).name}"`);
        res.sendFile(file.name, { root: 'uploads/'});
      } else {
        res.status(404);
      }
    })
  } catch (e) {
    res.sendStatus(404);
  }
});

router.put('/file/rename', authenticateJWT, checkDrive, checkFolder, async function(req, res, next) {
  try {
    await prisma.file.update({
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

router.put('/file/copy', authenticateJWT, checkDrive, checkFolder, async function(req, res, next) {
  try {
    const file = await prisma.file.findUnique({
      where: {
        uuid: req.params.uuid,
      }
    })
    file.uuid = Buffer.from(crypto.randomUUID(), 'hex')
    .then(
      await prisma.file.create({
        data: file,
      })
      .then(
        await prisma.drive.update({
          where: {
            uuid: req.body.driveUuid,
          },
          data: {
            spaceUsed: { increment: file.size },
          },
        })
        .then(
          res.sendStatus(201),
        )
      )  
    )   
  } catch (e) {
    res.sendStatus(404);
  }
});

router.put('/file/move', authenticateJWT, checkDrive, checkFolder, async function(req, res, next) {
  try {
    await prisma.file.update({
      where: {
        uuid: req.body.fileUuid,
      },
      data: {
        name: req.body.parentFolder,
      },
    })
    .then(
      res.sendStatus(200),
    )
  } catch (e) {
    res.sendStatus(404);
  }
});

router.put('/file/remove', authenticateJWT, checkDrive, checkFolder, async function(req, res, next) {
  try {
    await prisma.drive.update({
      where: {
        uuid: req.body.fileUuid,
      },
      data: {
        parentUuid: '/trash'
      },
    })
    .then(
      res.sendStatus(200),
    )
  } catch (e) {
    res.sendStatus(404);
  }
});

router.delete('/file/delete', authenticateJWT, checkDrive, async function(req, res, next) {
  try {
    await prisma.file.delete({
      where: {
        uuid: req.body.fileUuid,
      },
    })
    .then(
      await prisma.drive.update({
        where: {
          uuid: req.body.driveUuid,
        },
        data: {
          spaceUsed: { decrement: req.file.size },
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
  
module.exports = router;