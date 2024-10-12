const jwt = require('jsonwebtoken');

const driveService = require('../services/drive.service.js')


const driveMiddleware = {
  checkDrive: async (req, res, next) => { 
    if (req.body.driveData) {
      driveService.getDrive(req.body.driveData)
      .then(drive => {
        if (drive) {
          if (drive.ownerUuid === req.user.uuid) {
            req.drive = drive;
            next();
          } else {
            return res.sendStatus(403);
          }
        } else {
          return res.sendStatus(404);
        }
      })
      .catch(err => {
        console.log(err);
        return res.sendStatus(400);
      })
    } else {
      return res.sendStatus(400);
    }
  },
  
  checkDriveSpace: async (req, res, next) => {
    if ((req.drive.spaceUsed + parseInt(req.headers['content-length'])) < req.drive.spaceTotal) {
      next();
    } else {
      return res.sendStatus(413);
    }
  },
}



module.exports = driveMiddleware;