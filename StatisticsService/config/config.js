const path = require('path');
const rootPath = path.normalize(__dirname + '/..');
const env = process.env.NODE_ENV || 'development';

const config = {
  development: {
    root: rootPath,
    app: {
      name: 'statisticsservice'
    },
    port: process.env.PORT || 3006,
    db: 'mongodb://localhost/statisticsservice-development'
  },

  test: {
    root: rootPath,
    app: {
      name: 'statisticsservice'
    },
    port: process.env.PORT || 3006,
    db: 'mongodb://localhost/statisticsservice-test'
  },

  production: {
    root: rootPath,
    app: {
      name: 'statisticsservice'
    },
    port: process.env.PORT || 3006,
    db: 'mongodb://localhost/statisticsservice-production'
  }
};

module.exports = config[env];
