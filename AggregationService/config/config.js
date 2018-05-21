var path = require('path'),
    rootPath = path.normalize(__dirname + '/..'),
    env = process.env.NODE_ENV || 'development';

var config = {
  development: {
    root: rootPath,
    app: {
      name    : 'aggregationservice',
      id      : 'aggregator',
      secret  : 'aggregatorKey',
      timeout : 10000,
      repeat  : 4
    },
    port: process.env.PORT || 3000,
    db: 'mongodb://localhost/aggregator-development'
  },

  test: {
    root: rootPath,
    app: {
      name: 'aggregationservice',
      id      : 'aggregator',
      secret  : 'aggregatorKey',
      timeout : 50000,
      repeat  : 4
    },
    port: process.env.PORT || 3000,
    db: 'mongodb://localhost/aggregator-development'
  },

  production: {
    root: rootPath,
    app: {
      name: 'aggregationservice',
      id      : 'aggregator',
      secret  : 'aggregatorKey',
      timeout : 50000,
      repeat  : 4
    },
    port: process.env.PORT || 3000,
    db: 'mongodb://localhost/aggregator-development'
  }
};

module.exports = config[env];