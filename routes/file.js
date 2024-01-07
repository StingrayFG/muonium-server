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

const checkDriveSpace = async (req, res, next) => {
  console.log('checkDriveSpace');
  if ((req.drive.spaceUsed + req.file.size) < req.drive.spaceTotal) {
    next();
  } else {
    return res.sendStatus(404);
  }
};

const checkParentFolder = async (req, res, next) => {
  console.log('checkParentFolder');
  if ((req.body.parentUuid === 'root') || (req.body.parentUuid === 'trash')) {
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

const checkFile = async (req, res, next) => {
  console.log('checkFile');
  await prisma.file.findUnique({
    where: {
      uuid: req.body.fileUuid,
    }
  })
  .then(result => {
    if (result) {
      req.body.file = result;
      next();
    }
  })
  .catch(() => {
    return res.sendStatus(404);
  })
};

// Endpoints
router.post('/file/upload/:userUuid/:driveUuid/:parentUuid', parseSize, authenticateJWT, 
checkDrive, checkDriveSpace, checkParentFolder, upload.single('file'), async function(req, res, next) {
  await prisma.file.create({
    data: {
      name: req.file.filename,
      uuid: crypto.randomUUID(),
      size: req.file.size,
      ownerUuid: req.params.userUuid,
      parentUuid: req.params.parentUuid,
      driveUuid: req.params.driveUuid,
    }
  })
  .then(
    await prisma.drive.update({
      where: {
        uuid: req.params.driveUuid,
      },
      data: {
        spaceUsed: { increment: req.file.size },
      },
    })
    .then(() => {
      return res.sendStatus(201)
    })
    .catch((e) => {
      return res.sendStatus(404);
    })
  ) 
  .catch((e) => {
    return res.sendStatus(404);
  }) 
});

router.post('/file/download', authenticateJWT, checkDrive, checkFile, async function(req, res, next) {
  const downloadToken = jwt.sign({ uuid: req.body.fileUuid }, process.env.ACCESS_TOKEN_SECRET);
  res.send({ downloadToken });
});

router.get('/file/download/:uuid/:token', async function(req, res, next) {
  jwt.verify(req.params.token, process.env.ACCESS_TOKEN_SECRET, async (err, file) => {
    console.log(file);
    if (err) { console.log(1); return res.sendStatus(403); }   
    else if (file.uuid != req.params.uuid) { console.log(2); return res.sendStatus(403); }   
    else if ((Math.floor(Date.now() / 1000) - file.iat) > 300) { console.log(3); return res.sendStatus(410); } 
    else {
      console.log(4); 
      await prisma.file.findUnique({
        where: {
          uuid: req.params.uuid,
        }
      })
      .then(result => {
        console.log(result)
        if (result) {
          res.set('Content-Disposition', `attachment; filename="${path.parse(result.name).name}"`);
          res.sendFile(result.name, { root: 'uploads/'});
        } else {
          res.status(404);
        }
      })
      .catch(() => {
        return res.sendStatus(404);
      })
    } 
  });
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
      res.sendStatus(200)
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
        res.sendStatus(201)
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
      res.sendStatus(200)
    )
  } catch (e) {
    res.sendStatus(404);
  }
});

router.put('/file/remove', authenticateJWT, checkDrive, checkParentFolder, checkFile, async function(req, res, next) {
  try {
    await prisma.file.update({
      where: {
        uuid: req.body.file.uuid,
      },
      data: {
        parentUuid: '/trash'
      },
    })
    .then(
      res.sendStatus(200)
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
        res.sendStatus(200)
      )
    )  
  } catch (e) {
    res.sendStatus(404);
  }
});
  
module.exports = router;