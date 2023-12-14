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


router.post('/file/upload', authenticateJWT, upload.single('file'), async function(req, res, next) {
  let drive;  
    
  try {  
    drive = await prisma.drive.findUnique({
      where: {
        uuid: req.body.driveUuid
      }
    })
  } catch (e) {
    res.sendStatus(409);
  }

  if (drive) {
    if ((drive.spaceUsed + req.file.size) < drive.spaceTotal) {
      try {
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
    }
  }

});
  