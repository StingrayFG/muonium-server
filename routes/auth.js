var jwt = require('jsonwebtoken');

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
  var exists = false;
  var user;

  try {
    user = await prisma.user.create({
      data: {
        login: req.body.userData.login,
        password: req.body.userData.password
      },
  })} catch (e) {
    exists = true;
  }

  if (user) {
    res.sendStatus(200);
  } else if (exists) {
    res.sendStatus(400);
  }
});

module.exports = router;
