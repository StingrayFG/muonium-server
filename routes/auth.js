var jwt = require('jsonwebtoken');
var crypto = require('crypto');

var express = require('express');
var router = express.Router();

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

router.post('/auth/login', async function(req, res, next) {
  let user;
  let drive;

  const getUser = async () => {
    result = await prisma.user.findUnique({
      where: {
        login: req.body.userData.login,
        password: req.body.userData.password,
      }
    })
    user = result;
    return result;
  }
  const getDrive = async (u) => {
    if (u) {
      result = await prisma.drive.findFirst({
        where: {
          ownerUuid: u.uuid,
        }
      })
      drive = result;
      return result;
    } else {
      return null;
    }
  }
  
  await getUser()
  .then(async result => (await getDrive(result)))
  .then(() => {
    if (user && drive) {
      const accessToken = jwt.sign({ login: user.login }, process.env.ACCESS_TOKEN_SECRET);
      res.send({accessToken, userUuid: user.uuid, driveUuid: drive.uuid});
    } else {
      res.sendStatus(404);
    }  
  })
  .catch(
    res.sendStatus(409)
  )  
});

router.post('/auth/signup', async function(req, res, next) {
  let userUuid = crypto.randomUUID();
  Promise.all([
    await prisma.user.create({
      data: {
        uuid: userUuid,
        login: req.body.userData.login,
        password: req.body.userData.password,
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
    res.sendStatus(201)
  )
  .catch(
    res.sendStatus(409)
  )  
});

module.exports = router;
