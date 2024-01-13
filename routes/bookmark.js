var jwt = require('jsonwebtoken');

var express = require('express');
var router = express.Router();

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Middleware
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

const checkFolder = async (req, res, next) => {
  console.log('checkParentFolder');
  if (req.body.folderUuid == 'home') {
    next();
  } else if (req.body.folderUuid == 'trash') {
    next();
  } else if (req.body.folderUuid) {
    await prisma.folder.findUnique({
      where: {
        uuid: req.body.folderUuid,
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

router.post('/bookmark/create', authenticateJWT, checkFolder, async function(req, res, next) {
  await prisma.bookmark.create({
    data: {
      ownerUuid: req.body.userUuid,
      folderUuid: req.body.folderUuid,
    },
  })
  .then(() => {
    return res.sendStatus(201);
  })
  .catch((e) => {
    console.log(e)
    return res.sendStatus(404);
  })
});  

router.post('/bookmark/get', authenticateJWT, async function(req, res, next) {
  await prisma.bookmark.findMany({
    where: {
      ownerUuid: req.body.userUuid,
    },
  })
  .then(async result => {
    let bookmarks = []
    for await (let bookmark of result) {
      await prisma.folder.findUnique({
        where: {
          uuid: bookmark.folderUuid
        },
      })    
      .then(result => {
        bookmark.uuid = bookmark.ownerUuid + bookmark.folderUuid;
        bookmark.folder = result;
        bookmarks.push(bookmark)
      })
    }
    return res.send(bookmarks);
  })
  .catch(() => {
    return res.sendStatus(404);
  })
});  

router.post('/bookmark/delete', authenticateJWT, async function(req, res, next) {
  await prisma.bookmark.delete({
    where: {
      ownerUuid_folderUuid: {
        ownerUuid: req.body.userUuid,
        folderUuid: req.body.folderUuid,
      },
    },
  })
  .then(() => {
    return res.sendStatus(200);
  })
  .catch(() => {
    return res.sendStatus(404);
  })
});  

module.exports = router;
