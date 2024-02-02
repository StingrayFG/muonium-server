var jwt = require('jsonwebtoken');

var express = require('express');
var router = express.Router();

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Middleware

// check JWT in Authorization header
const authenticateJWT = (req, res, next) => { 
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
      if (err) { 
        return res.sendStatus(403); 
      } else if (user.uuid != req.body.userUuid) { 
        return res.sendStatus(403); 
      } else { 
        req.user = user; 
        next();
      } 
    });
  } else {
    return res.sendStatus(401);
  }
};


router.post('/bookmark/create', authenticateJWT, async function(req, res, next) {
  await prisma.bookmark.create({
    data: {
      ownerUuid: req.body.userUuid,
      folderUuid: req.body.folderUuid,
    },
  })
  .then(() => {
    return res.sendStatus(201);
  })
  .catch(() => {
    return res.sendStatus(500);
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
    for await (let bookmark of result) { // Find the bookmarked folder
      await prisma.folder.findUnique({
        where: {
          uuid: bookmark.folderUuid,
          isRemoved: false,
        },
      })    
      .then(result => { // If its found, add the related bookmark to the response
        if (result) {
          bookmark.uuid = bookmark.ownerUuid + bookmark.folderUuid;
          bookmark.folder = result;
          bookmarks.push(bookmark)
        }
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
    return res.sendStatus(204);
  })
  .catch(() => {
    return res.sendStatus(404);
  })
});  

module.exports = router;
