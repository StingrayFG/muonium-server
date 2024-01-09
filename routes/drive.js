var jwt = require('jsonwebtoken');
var crypto = require('crypto');

var express = require('express');
var router = express.Router();

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

router.post('/drive/get', async function(req, res, next) {
  await prisma.drive.findUnique({
    where: {
      uuid: req.body.uuid,
    }
  })
  .then(result => {
    return res.send(result);
  })
  .catch(() => {
    return res.sendStatus(404)
  })
});

module.exports = router;
