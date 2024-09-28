const driveService = require('../services/drive.service.js')


const driveController = {

  getDrive: async (req, res, next) => {
    await driveService.getDriveByUser(req.user)
    .then(driveData => {
      return res.send({ driveData });
    })
    .catch(err => {
      console.log(err);
      return res.sendStatus(404);
    })
  },

}

module.exports = driveController;
