const express = require('express');
const router = express.Router();
const orderManager = require('./../models/order');
const passport  = require('./../passport/my-passport');

module.exports = function (app) {
	app.use('/orders', router);
};

router.get('/', function (req, res, next) {
	return passport.checkServiceAuthorization(req, res, function(scope){
		let page = req.query.page;
		let count = req.query.count;
		const id = getUserId(req);
		return orderManager.getOrders(id, page, count, function (err, orders) {
			if (err) {
				if (err.kind == 'ObjectId')
					return res.status(400).send(responseTemplate('Error', { message: 'Invalid ID' }, scope));
				else
					return res.status(400).send(responseTemplate('Error', err, scope));
			}
			if (orders) {
				return orderManager.getCount(id, function (err, countRecord) {
					if (err)
						return res.status(500).send(responseTemplate('Error', err, scope));
					let data = {
						content: orders,
						info: {
							count: countRecord,
							pages: Math.ceil(countRecord / count) - 1,
							current: page,
							limit: count
						}
					};
					return res.status(200).send(responseTemplate('Ok', data, scope));
				});
			}
			return res.status(404).send(responseTemplate('Error','Not found orders', scope));
		});
	});
});

router.get('/:id', function (req, res, next) {
	return passport.checkServiceAuthorization(req, res, function(scope){
		const uid = getUserId(req);
		const id = req.params.id;
		return orderManager.getOrder(uid, id, function (err, order) {
			if (err) {
				if (err.kind == 'ObjectId')
					return res.status(400).send(responseTemplate('Error', { message: 'Bad request : Invalid ID' }, scope));
				else
					return res.status(400).send(responseTemplate('Error', err, scope));
			}
			if (order) {
				return res.status(200).send(responseTemplate('Ok', order, scope));
			}
			return res.status(404).send(responseTemplate('Error', { message: "Order isn't found" }, scope));
		});
	});
});

router.post('/', function (req, res, next) {
	return passport.checkServiceAuthorization(req, res, function(scope){
		let item = {
			userId: getUserId(req),
			carId: req.body.carID,
			from: req.body.from,
			to: req.body.to
		};
		return orders.createOrder(item, function (err, result) {
			if (err)
				return res.status(400).send(responseTemplate('Error', err, scope));
			if (result) {
				return res.status(201).send(responseTemplate('Ok', result, scope));
			}
			return res.status(500).send(responseTemplate('Ok', { message: "Order don't create" }, scope));
		});
	});
});

router.put('/:id/confirm', function (req, res, next) {
	return passport.checkServiceAuthorization(req, res, function(scope){
		const id = req.params.id;
		const uid = getUserId(req);
		return orders.changeOrderStatus(uid, id, 1, function (err, result) {
			if (err) {
				if (err.kind == "ObjectId")
					return res.status(400).send(responseTemplate('Error', { message: 'Bad request: bad ID' }, scope));
				else
					return res.status(400).send(responseTemplate('Error', { message: err }, scope));
			} else {
				if (result) {
					const data = {
						content: result,
						service: scope
					};
					return res.status(200).send(data);
				}
				return res.status(404).send(responseTemplate('Error', { message: 'Not found order' }, scope));
			}
		});
	});
});

router.put('/:id/paid', function (req, res, next) {
	return passport.checkServiceAuthorization(req, res, function(scope){
		const id = req.params.id;
		const uid = getUserId(req);
		const info = req.body;
		return orderManager.changeOrderStatus(uid, id, 2, function (err, result) {
			if (err) {
				if (err.kind == "ObjectId")
					return res.status(400).send(responseTemplate('Error', { message: 'Bad request:Bad ID' }, scope));
				else
					return res.status(400).send(responseTemplate('Error', err, scope));
			}
			if (result) {
				return res.status(200).send(responseTemplate('Ok', result, scope));
			}
			return res.status(404).send(responseTemplate('Error', { message: 'Order not found' }, scope));
		}, info);
	});
});

router.put('/:id/complete', function (req, res, next) {
	return passport.checkServiceAuthorization(req, res, function(scope){
		const id = req.params.id;
		const uid = getUserId(req);
		return orderManager.changeOrderStatus(uid, id, 3, function (err, result) {
			if (err) {
				if (err.kind == "ObjectId")
					return res.status(400).send(responseTemplate('Error', { message: 'Bad ID' }, scope));
				else
					return res.status(400).send(responseTemplate('Error', err, scope));
			}
			if (result) {
				return res.status(202).send(responseTemplate('Ok', result, scope));
			}
			return res.status(404).send(responseTemplate('Error', { message: 'Not found order' }, scope));
		});
	});
});

router.put('/:id/change', function (req, res, next) {
	return passport.checkServiceAuthorization(req, res, function(scope){
		const id = req.params.id;
		let info = req.body;
		return orderManager.changeOrder(id, info, function (err, result) {
			if (err) {
				if (err.kind == "ObjectId")
					return res.status(400).send(responseTemplate('Error', { message: 'Bad ID' }, scope));
				else
					return res.status(400).send(responseTemplate('Error', err, scope));
			}
			if (result) {
				return res.status(202).send(responseTemplate('Ok', result, scope));
			}
			return res.status(404).send(responseTemplate('Error', { message: 'Not found order' }, scope));
		});
	});
});

/**
 * get response template by unification response by server
 * @param {String} status response status
 * @param {Object} content information by send
 * @returns {Object} response information
 */
function responseTemplate(status, content, scope) {
	let container = {
		status: status,
		content: content,
		scope
	};
	return container;
}

function getUserId(req) {
	const id = req.headers['userid'];
	return id;
}