const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const redis = require('redis');
const { PrismaClient } = require('@prisma/client')


const router = express.Router();
const prisma = new PrismaClient()
const client = redis.createClient({ url: process.env.REDIS_URL })
client.connect().catch(console.error)


// MIDDLEWARE
const validateUserData = async (req, res, next) => {
  let isUserDataPresent = false;
  let isUserDataValidAsObject = false;
  let isLoginPresent = false;
  let isPasswordPresent = false;

  const checkUserData = () => {
    if ('userData' in req.body) {
      isUserDataPresent = true;
      if (typeof req.body.userData === 'object') { 
        isUserDataValidAsObject = true;
        checkLogin();
        checkPassword();
      }
    }
  }

  const checkLogin = () => {
    if ('login' in req.body.userData) {
      if (req.body.userData.login) {
        isLoginPresent = true;
      }
    }
  }

  const checkPassword = () => {
    if ('password' in req.body.userData) {
      if (req.body.userData.password) {
        isPasswordPresent = true;
      }
    }
  }

  checkUserData();

  if (!isUserDataPresent || !isUserDataValidAsObject) {
    return res.sendStatus(422);
  } else if (!isLoginPresent || !isPasswordPresent) {
    return res.sendStatus(400);
  } else {
    next();
  }
};


// ENDPOINTS
router.post('/auth/login', validateUserData, async function(req, res, next) {

  const getUser = async () => {
    return new Promise( async function(resolve, reject) {
      await prisma.user.findUnique({
        where: {
          login: req.body.userData.login,
        }
      })
      .then(user => {
        if (user) { 
          if (bcrypt.compareSync(req.body.userData.password, user.password)) { 
            resolve(user);
          } else {
            reject();
          }
        } else {
          reject();
        }
      })
      .catch(() => {
        reject();
      })
    })
  }

  const getDrive = async (user) => {
    return new Promise( async function(resolve, reject) {
      if (user) {
        result = await prisma.drive.findFirst({
          where: {
            ownerUuid: user.uuid,
          }
        })
        .then(drive => {
          if (drive) {
            resolve(drive);
          } else {
            reject();
          }
        })
        .catch(() => {
          reject();
        })
      }
    })
  }

  const getAll = async () => {
    return new Promise( async function(resolve, reject) {
      await getUser()
      .then(async user => {
        await getDrive(user)
        .then(async drive => {
          if (user && drive) {
            resolve({ 
              userData: {
                uuid: user.uuid,
                login: user.login,
                accessToken: jwt.sign({ uuid: user.uuid }, process.env.ACCESS_TOKEN_SECRET)
              }, 
              driveData: {
                uuid: drive.uuid
              }
            });
          } else {
            reject();
          }  
        })
      })
      .catch(() => {
        reject();
      })          
    })
  }
  

  const loginAttempt = await client.get(req.headers['x-forwarded-for'] + '-login'); 

  if (!loginAttempt) {
    client.set(req.headers['x-forwarded-for'] + '-login', ' ');
    client.expire(req.headers['x-forwarded-for'] + '-login', 3); 

    await getAll()
    .then(data => {
      return res.send(data);
    })
    .catch(() => {
      return res.sendStatus(404);
    })
  } else {
    return res.sendStatus(423);
  }
});


router.post('/auth/signup', validateUserData, async function(req, res, next) {

  const createUser = async () => {
    return new Promise(async function(resolve, reject) {
      const userUuid = crypto.randomUUID();
      const saltRounds = 1000;
      const hashedPassword = bcrypt.hashSync(req.body.userData.password, saltRounds);

      await prisma.user.create({
        data: {
          uuid: userUuid,
          login: req.body.userData.login,
          password: hashedPassword
        }
      })
      .then(user => {
        resolve(user);
      })
      .catch(() => {
        reject();
      })
    })
  }

  const createDrive = async (user) => {
    return new Promise(async function(resolve, reject) {
      await prisma.drive.create({
        data: {
          uuid: crypto.randomUUID(),
          ownerUuid: user.uuid,
          spaceTotal: 1024 * 1024 * process.env.NEW_DRIVE_SIZE,
          spaceUsed: 0,
        },
      })
      .then(drive => {
        resolve(drive);
      })
      .catch(() => {
        reject();
      })
    })
  }

  const createAll = async () => {
    return new Promise(async function(resolve, reject) {
      await createUser()
      .then(async user => {
        await createDrive(user)
        .then(async drive => {
          if (user && drive) {
            resolve();
          } else {
            reject();
          }   
        })
      })
      .catch(() => {
        reject();
      })
    })
  }


  const signupAttempt = await client.get(req.headers['x-forwarded-for'] + '-signup'); 

  if (!signupAttempt) {
    await createAll()
    .then(() => {
      client.set(req.headers['x-forwarded-for'] + '-signup', ' ');
      client.expire(req.headers['x-forwarded-for'] + '-signup', 3600);
      return res.sendStatus(201);
    })
    .catch(() => {
      return res.sendStatus(409);
    })
  } else {
    return res.sendStatus(423);
  }
});

module.exports = router;
