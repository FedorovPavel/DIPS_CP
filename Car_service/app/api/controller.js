const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const catalog = require('./../models/catalog');

module.exports = (app) => {
  app.use('/', router);
};

/**
 * get response template by unification response by server
 * @param {String} status response status
 * @param {Object} content information by send
 * @returns {Object} response information
 */
function responseTemplate(status, content) {
  let container = {
    status: status,
    content: content
  };
  return container;
}

//  get cars
router.get('/cars', function (req, res, next) {
  let page = req.query.page;
  let count = req.query.count;
  page = (page == undefined || !Number.isInteger(Number(page))) ? 0 : Number(page);
  count = (count == undefined || !Number.isInteger(Number(count))) ? 10 : Number(count);
  return catalog.getCars(page, count, function (err, cars) {
    if (err) {
      return res.status(500).send(responseTemplate('Error', 'Sorry DB doesn\'t work now, please try again later'));
    }
    return catalog.getCount(function (err, countRecord) {
      if (err) {
        return res.status(500).send(responseTemplate('Error', 'Undefined count elements'));
      }
      const data = {
        cars: cars,
        info: {
          count: countRecord,
          pages: Math.ceil(countRecord / count) - 1,
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
  let list = String(req.query.ids);
  if (list && list != "undefined" && list.length > 0) {
    list = list.split(',');
    return catalog.getList(list, function (err, cars) {
      if (err) {
        return res.status(500).send(responseTemplate('Error', 'Sorry DB doesn\'t work now, please try again later'));
      }
      let response = responseTemplate('Ok', cars);
      return res.status(200).send(response);
    });
  } else {
    return res.status(400).send(responseTemplate('Error', 'ids is not defined'));
  }
});

// get car
router.get('/car/:id', function (req, res, next) {
  const id = req.params.id;
  return catalog.getCar(id, function (err, car) {
    if (err) {
      if (err.kind == "ObjectID") {
        return res.status(400).send(responseTemplate('Error', 'Bad request: Invalid ID'));
      } else {
        return res.status(500).send(responseTemplate('Error', 'Sorry DB doesn\'t work now, please try again later'));
      }
    } else {
      let response = responseTemplate('Ok', car);
      return res.status(200).send(response);
    }
  });
});

//  create new car
router.post('/', function (req, res, next) {
  const carInfo = req.body;
  return catalog.createCar(carInfo, function (err, car) {
    if (err) {
      return res.status(400).send(responseTemplate('Error', err));
    }
    return res.status(201).send(responseTemplate('Ok', car));
  });
});

//  update car
router.put('/:id', function (req, res, next) {
  const id = req.params.id;
  const updateFields = req.body;
  if (!updateFields || updateFields == undefined) {
    return res.status(400).send(responseTemplate('Error', 'Bad request: dont\'t exist update fields'));
  }
  return catalog.updateCar(id, updateFields, function (err, car) {
    if (err) {
      return res.status(400).send(responseTemplate('Error', err));
    }
    return res.status(202).send(responseTemplate('Ok', car));
  });
});

//  update rent date
router.put('/:id/rent', function (req, res, next) {
  const id = req.params.id;
  const uid = req.body.uid;
  if (!uid || uid == undefined) {
    return res.status(400).send(responseTemplate('Error', 'Bad request: userId is undefined'));
  }
  const from = Date.parse(req.body.from);
  const to = Date.parse(req.body.to);
  if (!from || !to || from == undefined || to == undefined) {
    return res.status(400).send(responseTemplate('Error', 'Bad request: rent data is undefined'));
  }
  const updateFields = {
    state: 0,
    rentDate: {
      renter: uid,
      from: new Date(from),
      to: new Date(to)
    }
  };
  return catalog.updateCarRent(id, updateFields, function (err, car) {
    if (err) {
      return res.status(400).send(responseTemplate('Error', err));
    }
    return res.status(200).send(responseTemplate('Ok', car));
  });
});

router.delete('/:id', (req, res ,next) => {
  const id = req.params.id;
  if (id == undefined || id == 'undefined') {
    return res.status(400).send(responseTemplate('Error', 'Bad id'));
  }
  return catalog.deleteCar(id, (err) => {
    if (err) {
      return res.status(500).send(responseTemplate('Error', err));
    }
    return res.status(200).send(responseTemplate('OK'));
  });
});

//  update rent date
router.delete('/:id/rent/:rid', function (req, res, next) {
  const id = req.params.id;
  const rid = req.params.rid;
  if (!rid || rid == undefined) {
    return res.status(400).send(responseTemplate('Error', 'Bad request: userId is undefined'));
  }
  const deleteRecord = {
    state: 1,
    _id: rid
  };
  return catalog.updateCarRent(id, deleteRecord, function (err, car) {
    if (err) {
      return res.status(400).send(responseTemplate('Error', err));
    }
    return res.status(200).send(responseTemplate('Ok', car));
  });
});