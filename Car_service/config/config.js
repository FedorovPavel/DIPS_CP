const path = require('path');
const rootPath = path.normalize(__dirname + '/..');
const env = process.env.NODE_ENV || 'development';

const config = {
  development: {
    root: rootPath,
    app: {
      name: 'car-service'
    },
    port: process.env.PORT || 3000,
    db: 'mongodb://localhost/car-service-development'
  },

  test: {
    root: rootPath,
    app: {
      name: 'car-service'
    },
    port: process.env.PORT || 3000,
    db: 'mongodb://localhost/car-service-test'
  },

  production: {
    root: rootPath,
    app: {
      name: 'car-service'
    },
    port: process.env.PORT || 3000,
    db: 'mongodb://localhost/car-service-production'
  }
};

module.exports = config[env];
