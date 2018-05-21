const express = require('express');
const router = express.Router();
const mongoose = require('mongoose'),
      AuthCode = mongoose.model('AuthCodeInfo'),
      AuthToken = mongoose.model('AuthTokenInfo'),
      DraftOrder = mongoose.model('DraftOrderInfo');
const rec       = require('./../receiver/receiver'),
      passport  = require('./../passport/my-passport');;

module.exports = (app) => {
  app.use('/report', router);
};

router.get('/all-report', (req, res, next) => {
  return passport.checkServiceAuthorization(req, res, function(scope){
    let response = {
      service : scope
    };
    return AuthCode.getAllRecord(function(err, ac_records){
      if (!err || ac_records){
        response.authCode = ac_records;
      }
      return AuthToken.getAllRecord(function(err, at_records){
        if (!err || at_records){
          response.authToken = at_records;
        }
        return DraftOrder.getAllRecord(function(err, do_records){
          if (!err || do_records)
            response.draftOrder = do_records;
          return res.status(200).send(response);
        });
      });
    })
  });
});