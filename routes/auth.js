var jwt = require('jsonwebtoken');
var crypto = require('crypto');
var bcrypt = require('bcrypt');

var express = require('express');
var router = express.Router();

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const redis = require('redis');
const client = redis.createClient({
  url: process.env.REDIS_URL,
})
client.connect().catch(console.error)

// Handle login
router.post('/auth/login', async function(req, res, next) {
  // Search for a login attempt from request's origin ip record 
  const loginAttempt = await client.get(req.headers['x-forwarded-for'] + '-login'); 
  console.log(loginAttempt)

  if (!loginAttempt) {
    // Create a new redis record with ttl=30s to limit login requests to one per 30s
    client.set(req.headers['x-forwarded-for'] + '-login', ' ');
    client.expire(req.headers['x-forwarded-for'] + '-login', 10); 

    try {
      let user;
      let drive;
    
      const getUser = async () => {
        return new Promise( async function(resolve, reject) {
          await prisma.user.findUnique({ // Find a user based on login in request
            where: {
              login: req.body.login,
            }
          })
          .then(result => {
            if (result) { 
              if (bcrypt.compareSync(req.body.password, result.password)) { // Compare password in request with the found user's password hashsum
                user = result;
                resolve(result);
              } else {
                reject();
              }
            } else {
              reject();
            }
          })
        })
      }
    
      const getDrive = async (u) => {
        return new Promise( async function(resolve, reject) { // Find the found user's drive
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
      
      await getUser()
      .then(async result => {
        await getDrive(result)
      })
      .then(() => {
        if (user && drive) {
          const accessToken = jwt.sign({ uuid: user.uuid }, process.env.ACCESS_TOKEN_SECRET); // Sign jwt if both user and drive have been found
          return res.send({ userUuid: user.uuid, login: user.login, accessToken, driveUuid: drive.uuid });
        } else {
          return res.sendStatus(404);
        }  
      })
      .catch(() => {
        return res.sendStatus(404)
      })  
    } catch {
      return res.sendStatus(500);
    }
  } else {
    return res.sendStatus(423);
  }
});

router.post('/auth/signup', async function(req, res, next) {
  // Search for a signup attempt from request's origin ip record 
  const signupAttempt = await client.get(req.headers['x-forwarded-for'] + '-signup'); 

  if (!signupAttempt) {
    let userUuid = crypto.randomUUID();

    const saltRounds = 10;
    const hashedPassword = bcrypt.hashSync(req.body.password, saltRounds);

    try {
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
        // If a new account has been created successfully, create a new redis record with ttl=1h to limit signup requests to one per hour
        client.set(req.headers['x-forwarded-for'] + '-signup', ' ');
        client.expire(req.headers['x-forwarded-for'] + '-signup', 3600);
  
        return res.sendStatus(201)
      })
      .catch(() => {
        return res.sendStatus(409)
      })
    } catch {
      return res.sendStatus(500);
    }   
  } else {
    return res.sendStatus(423);
  }
});

module.exports = router;
