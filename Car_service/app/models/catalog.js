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
    required: true,
    default: 1
  },
  transmission: {
    type: String,
    enum: ['auto', 'manual', 'robot'],
    required: true
  },
  rentDate: {
    type: [{
      renter: {
        type: String,
        required: true
      },
      from: {
        type: Date,
        required: true
      },
      to: {
        type: Date,
        required: true
      }
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

CatalogSchema.statics.getList = function (ids, cb) {
  return this.find({ _id: { $in: ids } }, function (err, list) {
    if (err) {
      return cb(err);
    }
    return cb(null, list);
  });
}

CatalogSchema.statics.getCar = function (id, cb) {
  return this.findById(id, function (err, list) {
    if (err) {
      return cb(err);
    }
    return cb(null, list);
  });
}

CatalogSchema.statics.getCount = function (callback) {
  return this.count({}, function (err, count) {
    if (err) {
      return callback(err, null);
    }
    return callback(null, count);
  });
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

CatalogSchema.statics.removeCar = function (id, cb) {
  return this.remove({ _id: id }, function (err) {
    if (err) {
      return cb(err);
    }
    return cb(null);
  });
}

CatalogSchema.statics.updateCar = function (id, info, cb) {
  return this.findByIdAndUpdate(id, { $set: info }, { new: true }, function (err, car) {
    if (err) {
      return cb(err);
    }
    return cb(null, car);
  });
}

CatalogSchema.statics.checkRentDate = function (id, from, to, cb) {
  return this.findById(id, function (err, car) {
    if (err) {
      return cb(err);
    }
    if (!car) {
      return cb({message: "Car not found"});
    }
    let state = true;
    for (let I = 0; I < car.rentDate.length; I++) {
      let item = car.rentDate[I];
      if (!((to > item.to && from > item.to) || (to < item.from && from < item.from))) {
        state = false;
        break;
      }
    }
    return cb(null, state);
  });
}

CatalogSchema.statics.addRentRecord = function (id, record, cb) {
  const that = this;
  return this.checkRentDate(id , record.rentDate.from, record.rentDate.to, function (err, state) {
    if (err) {
      return cb(err);
    }
    if (!state) {
      return cb({state: 'warning', code: "rent is busy"});
    }
    return that.findByIdAndUpdate(id, { $push: { rentDate: record.rentDate } }, { new: true }, function (err, car) {
      if (err) {
        return cb(err);
      }
      return cb(null, car);
    });
  });
}

CatalogSchema.statics.removeRentRecord = function (id, record, cb) {
  return this.findByIdAndUpdate(id, { $pull: { rentDate: record } }, { new: true }, function (err, car) {
    if (err) {
      return cb(err);
    }
    return cb(null, car);
  });
}

let catalogModel = mongoose.model('catalog', CatalogSchema);
const uuid = require('uuid').v4;

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
    let tIds = [];
    for (let I = 0; I < ids.length; I++) {
      try {
        tIds.push(mongoose.Types.ObjectId(ids[I]));
      } catch (err) {
        return callback({ message: "Invalid ID: " + ids[I] });
      }
    }
    return catalogModel.getList(tIds, function (err, cars) {
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
    try {
      id = mongoose.Types.ObjectId(id);
    } catch (err) {
      return callback({ kind: "ObjectID", message: "Invalid ID" });
    }
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

  /**
   * Create car with info from "info"
   * @param {Object} info information about car
   * @param {Function} callback 
   */
  createCar(info, callback) {
    let err = false;
    let newRecord = new catalogModel({
      manufacture: info.manufacture,
      type: info.type,
      person: info.person,
      transmission: info.transmission,
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

  /**
   * Delete car with id= "id"
   * @param {String} id CarId
   * @param {Function} callback 
   */
  deleteCar(id, callback) {
    try {
      id = mongoose.Types.ObjectId(id);
    } catch (err) {
      return callback({ kind: "ObjectID", message: "Invalid ID" });
    }
    return catalogModel.removeCar(id, function (err) {
      if (err)
        return callback(err);
      return callback(null);
    });
  }

  /**
   * Update information about car
   * @param {String} id CarId
   * @param {Object} info new information
   * @param {Function} callback 
   */
  updateCar(id, info, callback) {
    try {
      id = mongoose.Types.ObjectId(id);
    } catch (err) {
      return callback({ kind: "ObjectID", message: "Invalid ID" });
    }
    return catalogModel.updateCar(id, info, function (err, uCar) {
      if (err) {
        return callback(err);
      }
      return callback(null, uCar.getObject());
    });
  }

  /**
   * Обновление даты аренды автомобиля
   * @param {String} id ID пользователя
   * @param {Object} info объект арендования автомобиля
   * @param {Function} callback 
   */
  updateCarRent(id, info, callback) {
    try {
      id = mongoose.Types.ObjectId(id);
    } catch (err) {
      return callback({ kind: 'ObjectID', message: "Invalid ID" });
    }
    const state = info.state;
    delete info.state;
    switch (state) {
      case 0: {  // Add
        return catalogModel.addRentRecord(id, info, function (err, uCar) {
          if (err) {
            return callback(err);
          }
          return callback(null, uCar.getObject());
        });
        break;
      }
      case 1: {   //  Remove
        return catalogModel.removeRentRecord(id, info, function (err, uCar) {
          if (err) {
            return callback(err);
          }
          return callback(null, uCar.getObject());
        });
        break;
      }
      default: {
        return callback({ message: "State is undefined" });
      }
    }
    return;
  }
}();

module.exports = middleware;