const prisma = require('../instances/prisma.js')
const crypto = require('crypto');
const bcrypt = require('bcrypt');


const userService = {
  getUser: async (userData) => {
    return new Promise( async function(resolve, reject) {
      await prisma.user.findUnique({
        where: {
          login: userData.login,
        }
      })
      .then(user => {
        if (user) { 
          if (bcrypt.compareSync(userData.password, user.password)) { 
            resolve(user);
          } else {
            reject();
          }
        } else {
          reject();
        }
      })
      .catch(err => {
        console.log(err);
        reject();
      })
    })
  },

  createUser: async (userData) => {
    return new Promise(async function(resolve, reject) {
      const userUuid = crypto.randomUUID();
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds)
 
      await prisma.user.create({
        data: {
          uuid: userUuid,
          login: userData.login,
          password: hashedPassword
        }
      })
      .then(user => {
        resolve(user);
      })
      .catch(err => {
        console.log(err);
        reject();
      })
    })
  }
}

module.exports = userService;
