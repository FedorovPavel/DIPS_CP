const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CatalogSchema = new Schema({
  manufacture: {
    type: String,
    required: true
  },
  model: {
    type: String
  },
  type: {
    type: String,
    enum: ['sedan', 'hatchback', 'SUV', 'wagon', 'van', 'coupe', 'minivan', 'other'],
    required: true,
    default: 'other'
  },
  doors: {
    type: Number,
    min: 1,
  },
  person: {
    type: Number,
    min: 1,
    required: true
  },
  transmission: {
    type: String,
    enum: ['auto','manual', 'robot'],
    required: true
  },
  rentDate: {
    type: [{
      renter: String,
      from: Date,
      to: Date
    }],
    default: []
  },
  cost: {
    type: Number,
    required: true,
    min: 0
  }
});

//  Statics methods
CatalogSchema.statics.getCars = function (skip, limit, cb) {
  return this.find({}, function (err, result) {
    if (err) {
      return cb(err, null);
    }
    return cb(null, result);
  }).skip(skip).limit(limit);
}

CatalogSchema.statics.getCount = function (callback) {
  return this.find({}, function (err, count) {
    if (err) {
      return callback(err, null);
    }
    return callback(null, count);
  }).count();
}

//  Documents methods
CatalogSchema.methods.getObject = function () {
  let rentDates = [];
  if (this.rentDate && this.rentDate.length > 0) {
    rentDates = this.rentDate.slice();
  }
  let container = {
    id: this._id.toString(),
    manufacture: this.manufacture,
    model: this.model,
    type: this.type,
    doors: this.doors,
    person: this.person,
    rentDate: rentDates,
    transmission: this.transmission,
    cost: this.cost
  };
  return container;
}

CatalogSchema.statics.saveDocument = function (document, callback) {
  return document.save(function (err, newDoc) {
    if (err)
      return callback(err, null);
    return callback(null, newDoc);
  });
}

let catalogModel = mongoose.model('catalog', CatalogSchema);

let middleware = new class {
  constructor() {

  }

  /**
   * Get car list from db on page "page: in quantity "count"
   * @param {Number} page page on DB by getting cars
   * @param {Number} count count cars getting from DB
   * @param {function} callback callback with work result
   */
  getCars(page = 0, count = 10, callback) {
    let skip = page * count;
    return catalogModel.getCars(skip, count, function (err, carDocs) {
      if (err) {
        callback(err, null);
      }

      if (!carDocs || carDocs.length == 0) {
        return callback('Not found car on page : ' + page + ' in quanitity: ' + count);
      }

      let result = [];
      for (let I = 0; I < carDocs.length; I++) {
        result.push(carDocs[I].getObject());
      }

      return callback(null, result);
    });
  }

  /**
   * Get count records on DB
   * @param {function} callback callback with work result
   */
  getCount(callback) {
    return catalogModel.getCount(function (err, count) {
      if (err) {
        return callback(err, null);
      }
      return callback(null, count);
    });
  }

  /**
   * Get cars from ids 
   * @param {Array} ids array of carId
   * @param {function} callback callback with work result
   */
  getList(ids, callback) {
    return catalogModel.getList(ids, function (err, cars) {
      if (err)
        return callback(err, null);
      let result = [];
      if (!cars || cars.length == 0)
        return callback(null, result);
      for (let I = 0; I < cars.length; I++) {
        result.push(cars[I].getObject());
      }
      return callback(null, result);
    });
  }

  /**
   * Get car by id
   * @param {string} id carId
   * @param {function} callback callback with work result
   */
  getCar(id, callback) {
    return catalogModel.getCar(id, function (err, car) {
      if (err) {
        return callback(err, null);
      }
      if (!car) {
        return callback(null, null);
      }
      let result = {};
      result = car.getObject();
      return callback(null, result);
    });
  }

  createCar(info, callback) {
    let err = false;
    let newRecord = new catalogModel({
      manufacture: info.manufacture,
      type: info.type,
      person: info.person,
      cost: info.cost
    });
    if (info.model)
      newRecord.model = info.model;
    if (info.doors)
      newRecord.doors = info.doors;
    if (info.images)
      newRecord.images = info.images;
    info.rentDate = [];

    return catalogModel.saveDocument(newRecord, function (err, document) {
      if (err) {
        return callback(err, null);
      }
      if (!document) {
        return callback(null, null);
      }
      let res = document.getObject();
      return callback(null, res);
    });
  }

}();

module.exports = middleware;