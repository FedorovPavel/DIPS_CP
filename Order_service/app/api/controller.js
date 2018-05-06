const express = require('express');
const router = express.Router();
const orderManager = require('./../models/order');
const billingManager = require('./../models/billing');

module.exports = function (app) {
	app.use('/', router);
};

router.get('/orders', function (req, res, next) {
	let page = req.query.page;
	let count = req.query.count;
	const id = getUserId(req);
	return orderManager.getOrders(id, page, count, function (err, orders) {
		if (err) {
			if (err.kind == 'ObjectId')
				return res.status(400).send(responseTemplate('Error', { message: 'Invalid ID' }));
			else
				return res.status(400).send(responseTemplate('Error', err));
		}
		if (orders) {
			return orderManager.getCount(id, function (err, countRecord) {
				if (err)
					return res.status(500).send(responseTemplate('Error', err));
				let data = {
					content: orders,
					info: {
						count: countRecord,
						pages: Math.ceil(countRecord / count) - 1,
						current: page,
						limit: count
					}
				};
				return res.status(200).send(responseTemplate('Ok', data));
			});
		}
		return res.status(404).send({ status: 'Error', message: 'Not found orders', service: scope });
	});
});

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