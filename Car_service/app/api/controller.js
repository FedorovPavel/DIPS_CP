const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const catalog = require('./../models/catalog');

module.exports = (app) => {
  app.use('/cars', router);
};

function responseTemplate(status, content) {
  let container = {
    status: status,
    content: content
  };
  return container;
}

//  get cars
router.get('/', function (req, res, next) {
  let page = Number(req.query.page);
  let count = Number(req.query.count);
  return catalog.getCars(page, count, function (err, cars) {
    if (err) {
      return res.status(400).send(responseTemplate('Error', err));
    }
    return catalog.getCount(function (err, countRecord) {
      if (err) {
        return res.status(500).send({ status: 'Error', message: 'undefined count elem', service: scope });
      }
      const data = {
        cars: result,
        info: {
          count: countRecord,
          pages: Math.ceil(count_record / count) - 1,
          current: page,
          limit: count
        }
      };
      let response = responseTemplate('Ok', data);
      return res.status(200).send(response);
    });
  });
});

//  get many cars
router.get('/list', function (req, res, next) {
  let list = String(req.query('ids'));
  if (list && list != "undefined" && list.length > 0) {
    list = list.split(',');
    return catalog.getList(list, function (err, cars) {
      if (err) {
        
      }
    });
  } else {
    return res.status(400).send(responseTemplate('Error', 'ids is not defined'));
  }
});


// get car
router.get('/:id', function (req, res, next) {
  return passport.checkServiceAuthorization(req, res, function (scope) {
    const id = req.params.id;
    return catalog.getCar(id, function (err, result) {
      if (err) {
        if (err.kind == "ObjectID")
          return res.status(400).send({ status: 'Error', message: 'Bad request: Invalid ID', service: scope });
        else
          return res.status(404).send({ status: 'Error', message: 'Car not found', service: scope });
      } else {
        const data = {
          content: result,
          service: scope
        }
        return res.status(200).send(data);
      }
    });
  });
});

// router.get('/ids', function(req, res, next){
//   let ids = String(req.params.ids);
//   ids.replace('-',',');
//   const arr = Array.from(ids);
//   catalog.getCars(arr, function(err ,result){
//     if (err){
//       res.status(400).send({status:'Error', message : err});
//     } else {
//       res.status(200).send(result);
//     }
//   });
// });

/*
router.get('/generate_random_cars', function (req, res, next) {
  const count = req.query.count ? req.query.count : 100;
    for (let I = 0; I < count; I++){
      let car = new catalog({
        Manufacturer  : 'Generate random car ' + I.toString(),
        Model         : 'Model ' + I.toString(),
        Type          : "Type" + (I%5).toString(),
        Doors         : (I % 9)+1,
        Person        : 1+I,
        Loactaion     : {
          City    : 'Moscow',
          Street  : I.toString() +'Советский переулок',
          House   : (100 - I)
        },
        Cost          : (I + 0.1)
      });
      catalog.saveNewCar(car, function(err, result){
        if (err)
          return next(err);
        else 
          console.log("Save new car " + I);
      });
    }
  res.status(200).send('Random ' + count + 'car');
});*/