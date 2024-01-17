var jwt = require('jsonwebtoken');
var crypto = require('crypto');

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

router.post('/drive/get', authenticateJWT, async function(req, res, next) {
  await prisma.drive.findUnique({
    where: {
      uuid: req.body.driveUuid,
    }
  })
  .then(result => {
    return res.send(result);
  })
  .catch(() => {
    return res.sendStatus(404)
  })
});

module.exports = router;
