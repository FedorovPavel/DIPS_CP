const express = require('express');
const	router = express.Router();
const orders = require('./../models/order');
const billing = require('./../models/billing');

module.exports = function (app) {
	app.use('/', router);
};

