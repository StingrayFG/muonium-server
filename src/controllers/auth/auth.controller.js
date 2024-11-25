const jwt = require('jsonwebtoken');

if (!process.env.IGNORE_AUTH_LIMIT) {
  const redis = require('../../instances/redis.js') 
}
const userService = require('../../services/user/user.service.js')
const driveService = require('../../services/drive.service.js')


const userController = {

  login: async (req, res, next) => { 
    let loginAttempt;
    if (!process.env.IGNORE_AUTH_LIMIT) {
      loginAttempt = await redis.get(req.headers['x-forwarded-for'] + '-login'); 
    }
    
    if (!loginAttempt || process.env.IGNORE_AUTH_LIMIT) {
      if (!process.env.IGNORE_AUTH_LIMIT) {
        redis.set(req.headers['x-forwarded-for'] + '-login', ' ');
        redis.expire(req.headers['x-forwarded-for'] + '-login', 3); 
      }

      await userService.getUser(req.body.userData)
      .then(user => {
        return res.send({ userData: {
          uuid: user.uuid,
          login: user.login,
          accessToken: jwt.sign({ uuid: user.uuid }, process.env.ACCESS_TOKEN_SECRET)
        }});
      })
      .catch(err => {
        console.log(err);
        res.statusMessage = 'User not found';
        return res.status(404).end();
      })
    } else {
      res.statusMessage = 'Too many login attempts';
      return res.status(423).end();
    }
  },

  signup: async (req, res, next) => {
    const createUserAndDrive = async () => {
      return new Promise(async function(resolve, reject) {
        await userService.createUser(req.body.userData)
        .then(async user => {
          await driveService.createDrive(user)
          .then(drive => {
            if (user && drive) {
              resolve();
            } else {
              reject();
            }   
          })
        })
        .catch(err => {
          console.log(err);
          reject();
        })
      })
    }

    let signupAttempt;
    if (!process.env.IGNORE_AUTH_LIMIT) {
      signupAttempt = await redis.get(req.headers['x-forwarded-for'] + '-signup'); 
    }

    if (!signupAttempt || process.env.IGNORE_AUTH_LIMIT) {
      await createUserAndDrive()
      .then(() => {
        if (!process.env.IGNORE_AUTH_LIMIT) {
          redis.set(req.headers['x-forwarded-for'] + '-signup', ' ');
          redis.expire(req.headers['x-forwarded-for'] + '-signup', 3600);
        }
        
        return res.status(201).end();
      })
      .catch(err => {
        console.log(err);
        res.statusMessage = 'Username is already used';
        return res.status(409).end();
      })
    } else {
      res.statusMessage = 'Too many signup attempts';
      return res.status(423).end();
    }
  }

}

module.exports = userController;
