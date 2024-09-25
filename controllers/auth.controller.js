const jwt = require('jsonwebtoken');

const redis = require('../instances/redis.js')
const userService = require('../services/user.service.js')
const driveService = require('../services/drive.service.js')


const userController = {

  login: async (req, res, next) => {

    const getAll = async () => {
      return new Promise(async function(resolve, reject) {
        await userService.getUser(req.body.userData)
        .then(async user => {
          await driveService.getDrive(user)
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
    
    const loginAttempt = await redis.get(req.headers['x-forwarded-for'] + '-login'); 

    if (!loginAttempt || process.env.IGNORE_AUTH_LIMIT) {
      redis.set(req.headers['x-forwarded-for'] + '-login', ' ');
      redis.expire(req.headers['x-forwarded-for'] + '-login', 3); 

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
  },

  signup: async (req, res, next) => {

    const createAll = async () => {
      return new Promise(async function(resolve, reject) {
        await userService.createUser(req.body.userData)
        .then(async user => {
          await driveService.createDrive(user)
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

    const signupAttempt = await redis.get(req.headers['x-forwarded-for'] + '-signup'); 

    if (!signupAttempt || process.env.IGNORE_AUTH_LIMIT) {
      await createAll()
      .then(() => {
        redis.set(req.headers['x-forwarded-for'] + '-signup', ' ');
        redis.expire(req.headers['x-forwarded-for'] + '-signup', 3600);
        return res.sendStatus(201);
      })
      .catch(() => {
        return res.sendStatus(409);
      })
    } else {
      return res.sendStatus(423);
    }
  }
}

module.exports = userController;
