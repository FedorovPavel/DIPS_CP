const mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	Billing = require('./billing');

const OrderSchema = new Schema({
	userId: {
		type: Schema.Types.ObjectId,
		required: true
	},
	carId: {
		type: Schema.Types.ObjectId,
		required: true
	},
	billing: Billing.Schema,
	status: {
		type: String,
		required: true
	},
	cost: {
		type: Number,
		required: true
	},
	lease: {
		startDate: {
			type: Date,
			required: true
		},
		endDate: {
			type: Date,
			required: true
		}
	},
	created: {
		type: Number,
		required: true
	}
});

OrderSchema.statics.createOrder = function (objectInfo, callback) {
	let object = Object(objectInfo);
	const check = checkRequiredFields(Object.keys(object));
	if (check) {
		let order = createOrder(object);
		if (order) {
			return order.save(function (err, result) {
				if (err)
					return callback(err, null);
				else {
					return callback(null, result.toObject());
				}
			});
		} else {
			return callback('Unknown fields', null);
		}
	} else {
		return callback('not found required fields', null);
	}
};

OrderSchema.statics.getOrders = function (userId, page = 0, count = 20, callback) {
	page = Number(page);
	count = Number(count);
	return this.find({ UserId: userId }, function (err, orders) {
		if (err)
			return callback(err, null);
		else {
			if (orders) {
				let result = [];
				for (let I = 0; I < orders.length; I++) {
					result.push(orders[I].toObject());
				}
				return callback(null, result);
			} else {
				return callback(null, null);
			}
		}
	}).skip(page * count).limit(count);
};

OrderSchema.statics.getOrder = function (uid, id, callback) {
	return this.findOne({ _id: id, userId: uid }, function (err, result) {
		if (err)
			return callback(err, null);
		else {
			if (result) {
				return callback(null, result.toObject());
			} else {
				return callback(null, null);
			}
		}
	});
};

OrderSchema.statics.getCount = function (uid, callback) {
	return this.count({ userId: uid }, function (err, count) {
		if (err)
			return callback(err, null);
		return callback(null, count);
	});
}

OrderSchema.statics.setConfirm = function (uid, id, callback) {
	return this.findOne({ _id: id, userId: uid }, function (err, order) {
		if (err)
			return callback(err, null);
		else {
			if (order) {
				if (order.status == 'Draft') {
					order.Status = 'Confirm';
					return order.save(function (err, res) {
						if (err)
							return callback(err, null);
						else
							return callback(null, res);
					});
				} else {
					return callback({ message: "Status don't right" }, null);
				}
			} else {
				return callback(null, null);
			}
		}
	});
};

OrderSchema.statics.setPaid = function (uid, id, info, callback) {
	return this.findOne({ _id: id, userId: uid }, function (err, order) {
		if (err)
			return callback(err, null);
		else {
			if (order) {
				if (order.status == 'WaitForBilling') {
					order.status = 'Paid';
					order.billing = info;
					return order.save(function (err, res) {
						if (err)
							return callback(err, null);
						else
							return callback(null, res.toObject());
					});
				} else {
					return callback({ message: "Status don't right" }, null);
				}
			} else {
				return callback(null, null);
			}
		}
	});
};

OrderSchema.statics.setComplete = function (uid, id, callback) {
	return this.findOne({ _id: id, userId: uid }, function (err, order) {
		if (err)
			return callback(err, null);
		else {
			if (order) {
				if (order.status == 'Paid') {
					order.status = 'Completed';
					return order.save(function (err, res) {
						if (err)
							return callback(err, null);
						else {
							return callback(null, res.toObject());
						}
					});
				} else {
					return callback({ message: "Status don't right" }, null);
				}
			} else {
				return callback(null, null);
			}
		}
	});
};

OrderSchema.methods.toObject = function () {
	const item = {
		id: this._id.toString(),
		userId: this.userId,
		carId: this.carId,
		billing: this.billing.toObject(),
		status: this.status,
		lease: {
			startDate: this.lease.startDate,
			endDate: this.lease.endDate
		},
		created: this.created
	};
	return item;
}

const orderORM = mongoose.model('Order', OrderSchema);

const manager = new class {

	getOrders(id, page, count, callback) {
		return orderORM.getOrders(id, page, count, callback);
	}

	getOrder(id, callback) {
		return orderORM.getOrder(id, callback);
	}

	getCount(uid, id, callback) {
		return orderORM.getCount(uid, id, callback);
	}

	createOrder(objectInfo, callback) {
		return orderORM.createOrder(objectInfo, callback);
	}

	changeOrderStatus(uid, id, state, callback, info = undefined) {
		switch (state) {
			case 1: {
				return orderORM.setConfirm(uid, id, callback);
			}
			case 2: {
				return orderORM.setPaid(uid, id, info, callback);
			}
			case 3: {
				return orderORM.setComplete(uid, id, callback);
			}
			default: {
				return callback({ message: "unknown operation" });
			}
		}
	}
}();

module.exports = manager;

function createOrder(object) {
	const model = mongoose.model('Order');
	let item = new model();
	let errorParse = false;
	for (key in object) {
		switch (key) {
			case 'userId':
				item.userId = mongoose.Types.ObjectId(object[key]);
				break;
			case 'carId':
				item.carId = mongoose.Types.ObjectId(object[key]);
				break;
			case 'startDate':
				item.lease.startDate = new Date(object[key]);
				break;
			case 'endDate':
				item.lease.endDate = new Date(object[key]);
				break;
			default:
				errorParse = true;
				break;
		}
	}
	if (errorParse)
		return null;
	item.created = Date.now();
	item.Status = 'Draft';
	return item;
}