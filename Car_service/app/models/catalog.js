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
  images: {
    type: [String],
  },
  rentDate: {
    type: [{
      renter: String,
      from: Date,
      to: Date
    }]
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
  let imgs = [];
  if (this.images && this.images.length > 0) {
    imgs = this.images.slice();
  }
  let rentDates = [];
  if (this.rentDate && this.rentDate.length > 0) {
    rentDates = this.rentDate.slice();
  }
  let container = {
    manufacture: this.manufacture,
    model: this.model,
    type: this.type,
    doors: this.doors,
    person: this.person,
    images: imgs,
    rentDate: rentDates,
    cost: this.cost
  };
  return container;
}

let catalogModel = mongoose.model('catalog', CatalogSchema);

let middleware = class {
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
    return catalogModel.getCars(skip, limit, function (err, carDocs) {
      if (err) {
        callback(err, null);
      }

      if (!carDocs) {
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

}();

module.exports = middleware;