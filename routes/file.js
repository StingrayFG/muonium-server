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

const checkDriveSpace = async (req, res, next) => {
  if ((req.drive.spaceUsed + req.file.size) < drive.spaceTotal) {
    next();
  } else {
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

const checkFile = async (req, res, next) => {
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
router.post('/file/upload', authenticateJWT, checkDrive, checkDriveSpace, checkParentFolder, upload.single('file'), async function(req, res, next) {
  try {
    await prisma.file.create({
      data: {
        name: req.file.fileName,
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

router.get('/file/download/:uuid', authenticateJWT, checkDrive, checkParentFolder, checkFile, async function(req, res, next) {
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

router.put('/file/rename', authenticateJWT, checkDrive, checkParentFolder, checkFile, async function(req, res, next) {
  try {
    await prisma.file.update({
      where: {
        uuid: req.body.file.uuid,
      },
      data: {
        name: req.body.fileNewName,
      },
    })
    .then(
      res.sendStatus(200),
    )
  } catch (e) {
    res.sendStatus(404);
  }
});

router.put('/file/copy', authenticateJWT, checkDrive, checkParentFolder, checkFile, async function(req, res, next) {
  try {
    req.body.file.uuid = Buffer.from(crypto.randomUUID(), 'hex');
    await prisma.file.create({
      data: req.body.file,
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
  } catch (e) {
    res.sendStatus(404);
  }
});

router.put('/file/move', authenticateJWT, checkDrive, checkParentFolder, checkFile, async function(req, res, next) {
  try {
    await prisma.file.update({
      where: {
        uuid: req.body.file.uuid,
      },
      data: {
        parentUuid: req.body.newParentUuid,
      },
    })
    .then(
      res.sendStatus(200),
    )
  } catch (e) {
    res.sendStatus(404);
  }
});

router.put('/file/remove', authenticateJWT, checkDrive, checkParentFolder, checkFile, async function(req, res, next) {
  try {
    await prisma.drive.update({
      where: {
        uuid: req.body.file.uuid,
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

router.delete('/file/delete', authenticateJWT, checkDrive, checkParentFolder, checkFile, async function(req, res, next) {
  try {
    await prisma.file.delete({
      where: {
        uuid: req.body.file.uuid,
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