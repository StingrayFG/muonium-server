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
var upload = multer({ storage: storage, limits: { fileSize: 1024 * 1024 *  process.env.MAX_FILE_SIZE } });

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

const parsePreUpload = async (req, res, next) => {
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
    return res.sendStatus(413);
  }
};

const checkParentFolder = async (req, res, next) => {
  console.log('checkParentFolder');
  if (req.body.parentUuid === 'home') {
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
      req.file = result;
      next();
    }
  })
  .catch(() => {
    return res.sendStatus(404);
  })
};

// Endpoints
router.post('/file/upload/:userUuid/:driveUuid/:parentUuid', parsePreUpload, authenticateJWT, 
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
      return res.sendStatus(201);
    })
    .catch(() => {
      return res.sendStatus(404);
    })
  ) 
  .catch(() => {
    return res.sendStatus(404);
  }) 
});

router.post('/file/download', authenticateJWT, checkDrive, checkFile, async function(req, res, next) {
  const downloadToken = jwt.sign({ uuid: req.body.fileUuid }, process.env.ACCESS_TOKEN_SECRET);
  return res.send({ downloadToken });
});

router.get('/file/download/:uuid/:token', async function(req, res, next) {
  jwt.verify(req.params.token, process.env.ACCESS_TOKEN_SECRET, async (err, file) => {
    if (err) { return res.sendStatus(403); }   
    else if (file.uuid != req.params.uuid) { return res.sendStatus(403); }   
    else if ((Math.floor(Date.now() / 1000) - file.iat) > 300) { return res.sendStatus(410); } 
    else {
      await prisma.file.findUnique({
        where: {
          uuid: req.params.uuid,
        }
      })
      .then(result => {
        if (result) {
          res.set('Content-Disposition', `attachment; filename="${path.parse(result.name).name}"`);
          return res.sendFile(result.name, { root: 'uploads/'});
        } else {
          return res.status(404);
        }
      })
      .catch(() => {
        return res.sendStatus(404);
      })
    } 
  });
});

router.put('/file/rename', authenticateJWT, checkDrive, checkFile, async function(req, res, next) {
  modificationDate = Date.now();

  fs.rename('uploads/' + req.file.name, 'uploads/' +  req.body.fileName + '.' + modificationDate, async (err) => {
    if (err) {
      return res.sendStatus(404);
    } else {
      await prisma.file.update({
        where: {
          uuid: req.file.uuid,
        },
        data: {
          name: req.body.fileName + '.' + modificationDate,
          modificationDate: new Date(modificationDate),
        },
      })
      .then(() => {
        return res.sendStatus(200);
      })
      .catch(() => {
        return res.sendStatus(404);
      })
    }
  })
});

router.put('/file/copy', authenticateJWT, checkDrive, checkFile, async function(req, res, next) {
  const originalFullName = req.file.name;
  const originalParentUuid = req.file.parentUuid;

  let copiedFile = req.file;
  copiedFile.parentUuid = req.body.parentUuid;
  copiedFile.uuid = crypto.randomUUID();

  let newDate = Date.now()
  copiedFile.creationDate = new Date(newDate);
  copiedFile.modificationDate = new Date(newDate);

  const originalName = path.parse(copiedFile.name).name; 
  const originalExtension = path.extname(originalName);

  if (req.body.parentUuid === originalParentUuid) {
    copiedFile.name = path.parse(originalName).name + ' - copy' + originalExtension + '.' + newDate;
  } else {
    copiedFile.name = path.parse(originalName).name + originalExtension + '.' + newDate;
  }

  fs.copyFile('uploads/' + originalFullName, 'uploads/' + copiedFile.name, async (err) => {
    if (err) {
      return res.sendStatus(404);
    } else {
      await prisma.file.create({
        data: copiedFile,
      })
      .then(async () => {
        await prisma.drive.update({
          where: {
            uuid: req.body.driveUuid,
          },
          data: {
            spaceUsed: { increment: req.file.size },
          },
        })
        .then(() => {
          return res.sendStatus(201);
        })
        .catch(() => {
          return res.sendStatus(404);
        })
      })  
      .catch(() => {
        return res.sendStatus(404);
      })  
    }
  });
});

router.put('/file/move', authenticateJWT, checkDrive, checkFile, async function(req, res, next) {
  await prisma.file.update({
    where: {
      uuid: req.file.uuid,
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

router.put('/file/remove', authenticateJWT, checkDrive, checkFile, async function(req, res, next) {
  await prisma.file.update({
    where: {
      uuid: req.file.uuid,
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

router.put('/file/recover', authenticateJWT, checkDrive, checkFile, async function(req, res, next) {
  await prisma.file.update({
    where: {
      uuid: req.file.uuid,
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

router.post('/file/delete', authenticateJWT, checkDrive, checkFile, async function(req, res, next) {
  fs.unlink('uploads/' +  req.file.name, async (err) => {
    if (err) {
      return res.sendStatus(404);
    } else {  
      await prisma.file.delete({
        where: {
          uuid: req.file.uuid,
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
        .then(() => {
          return res.sendStatus(200)
        })
        .catch(() => {
          return res.sendStatus(404);
        })
      ) 
      .catch(() => {
        return res.sendStatus(404);
      }) 
    }
  });
});
  
module.exports = router;