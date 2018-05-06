const express = require('express');
const router = express.Router();
const orderManager = require('./../models/order');
const billingManager = require('./../models/billing');

module.exports = function (app) {
	app.use('/orders', router);
};

router.get('/', function (req, res, next) {
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

router.get('/:id', function (req, res, next) {
	const uid = getUserId(req);
	const id = req.params.id;
	return orderManager.getOrder(uid, id, function (err, order) {
		if (err) {
			if (err.kind == 'ObjectId')
				return res.status(400).send(responseTemplate('Error', { message: 'Bad request : Invalid ID' }));
			else
				return res.status(400).send(responseTemplate('Error', err));
		}
		if (order) {
			return res.status(200).send(responseTemplate('Ok', order));
		}
		return res.status(404).send(responseTemplate('Error', { message: "Order isn't found" }));
	});
});

router.post('/', function (req, res, next) {
	let item = {
		userId: getUserId(req),
		carId: req.body.carID,
		startDate: req.body.startDate,
		endDate: req.body.endDate
	};
	return orders.createOrder(item, function (err, result) {
		if (err)
			return res.status(400).send(responseTemplate('Error', err));
		if (result) {
			return res.status(201).send(responseTemplate('Ok', result));
		}
		return res.status(500).send(responseTemplate('Ok', { message: "Order don't create" }));
	});
});

router.put('/:id/confirm', function (req, res, next) {
	const id = req.params.id;
	const uid = getUserId(req);
	return orders.changeOrderStatus(uid, id, 1, function (err, result) {
		if (err) {
			if (err.kind == "ObjectId")
				return res.status(400).send(responseTemplate('Error', { message: 'Bad request: bad ID' }));
			else
				return res.status(400).send(responseTemplate('Error', { message: err }));
		} else {
			if (result) {
				const data = {
					content: result,
					service: scope
				};
				return res.status(200).send(data);
			}
			return res.status(404).send(responseTemplate('Error', { message: 'Not found order' }));
		}
	});
});

router.put('/:id/paid', function (req, res, next) {
	const id = req.params.id;
	const uid = getUserId(req);
	const info = req.body;
	return orderManager.changeOrderStatus(uid, id, 2, function (err, result) {
		if (err) {
			if (err.kind == "ObjectId")
				return res.status(400).send(responseTemplate('Error', { message: 'Bad request:Bad ID' }));
			else
				return res.status(400).send(responseTemplate('Error', err));
		}
		if (result) {
			return res.status(200).send(responseTemplate('Ok', result));
		}
		return res.status(404).send(responseTemplate('Error', { message: 'Order not found' }));
	}, info);
});

router.put('/:id/complete', function (req, res, next) {
	const id = req.params.id;
	const uid = getUserId(req);
	return orderManager.changeOrderStatus(uid, id, 3, function (err, result) {
		if (err) {
			if (err.kind == "ObjectId")
				return res.status(400).send(responseTemplate('Error', { message: 'Bad ID' }));
			else
				return res.status(400).send(responseTemplate('Error', err));
		}
		if (result) {
			return res.status(202).send(responseTemplate('Ok', result));
		}
		return res.status(404).send(responseTemplate('Error', { message: 'Not found order' }));
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

function getUserId(req) {
	const id = req.headers['userid'];
	return id;
}