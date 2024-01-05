var jwt = require('jsonwebtoken');
var crypto = require('crypto');

var express = require('express');
var router = express.Router();

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

router.post('/auth/login', async function(req, res, next) {
  console.log(req.body);

  const user = await prisma.user.findUnique({
    where: {
      login: req.body.userData.login,
      password: req.body.userData.password
    }
  })

  res.setHeader('Content-Type', 'application/json');
  if (user) {
    const accessToken = jwt.sign({ username: user.login }, process.env.ACCESS_TOKEN_SECRET);
    res.send({exists: true, accessToken});
  } else {
    res.send({exists: false });
  }
});

router.post('/auth/signup', async function(req, res, next) {
  try {
    let userUuid = crypto.randomUUID();
    console.log(userUuid)
    await Promise.all([
      await prisma.user.create({
        data: {
          uuid: userUuid,
          login: req.body.userData.login,
          password: req.body.userData.password
        },
      }),
      await prisma.drive.create({
        data: {
          uuid: crypto.randomUUID(),
          ownerUuid: userUuid,
          spaceTotal: 1024 * 1024 * 100,
          spaceUsed: 0,
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

module.exports = router;
