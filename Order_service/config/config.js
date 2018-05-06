const path = require('path');
const rootPath = path.normalize(__dirname + '/..');
const env = process.env.NODE_ENV || 'development';

const config = {
  development: {
    root: rootPath,
    app: {
      name: 'order-service'
    },
    port: process.env.PORT || 3000,
    db: 'mongodb://localhost/order-service-development'
  },

  test: {
    root: rootPath,
    app: {
      name: 'order-service'
    },
    port: process.env.PORT || 3000,
    db: 'mongodb://localhost/order-service-test'
  },

  production: {
    root: rootPath,
    app: {
      name: 'order-service'
    },
    port: process.env.PORT || 3000,
    db: 'mongodb://localhost/order-service-production'
  }
};

module.exports = config[env];
