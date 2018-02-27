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
  Person: {
    type: Number,
    min: 1,
    required: true
  },
  Images: {
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

mongoose.model('catalog', CatalogSchema);