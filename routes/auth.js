var jwt = require('jsonwebtoken');
var crypto = require('crypto');
var bcrypt = require('bcrypt');

var express = require('express');
var router = express.Router();

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

router.post('/auth/login', async function(req, res, next) {
  let user;
  let drive;

  const getUser = async () => {
    return new Promise( async function(resolve, reject) {
      await prisma.user.findUnique({
        where: {
          login: req.body.login,
        }
      })
      .then(result => {
        if (bcrypt.compareSync(req.body.password, result.password)) {
          console.log(result)
          user = result;
          resolve(result);
        } else {
          reject();
        }
      })
    })
  }

  const getDrive = async (u) => {
    return new Promise( async function(resolve, reject) {
      if (u) {
        result = await prisma.drive.findFirst({
          where: {
            ownerUuid: u.uuid,
          }
        })
        .then(result => {
          if (result) {
            drive = result;
            resolve(result);
          } else {
            reject();
          }
        })
      }
    })
  }
  
  try {
    await getUser()
    .then(async result => {
      console.log(result)
      await getDrive(result)
    })
    .then(() => {
      if (user && drive) {
        const accessToken = jwt.sign({ uuid: user.uuid }, process.env.ACCESS_TOKEN_SECRET);
        return res.send({ userUuid: user.uuid, login: user.login, accessToken, driveUuid: drive.uuid });
      } else {
        return res.sendStatus(404);
      }  
    })
    .catch(() => {
      return res.sendStatus(404)
    })
  } catch (e) {
    return res.sendStatus(404);
  }
});

router.post('/auth/signup', async function(req, res, next) {
  try {
    let userUuid = crypto.randomUUID();

    const saltRounds = 10;
    const hashedPassword = bcrypt.hashSync(req.body.password, saltRounds);

    Promise.all([
      await prisma.user.create({
        data: {
          uuid: userUuid,
          login: req.body.login,
          password: hashedPassword,
        },
      }),
      await prisma.drive.create({
        data: {
          uuid: crypto.randomUUID(),
          ownerUuid: userUuid,
          spaceTotal: 1024 * 1024 * process.env.NEW_DRIVE_SIZE,
          spaceUsed: 0,
        },
      })
    ])
    .then(() => {
      return res.sendStatus(201)
    })
    .catch(() => {
      return res.sendStatus(404)
    })
  } catch (e) {
    return res.sendStatus(404);
  }
});

module.exports = router;
