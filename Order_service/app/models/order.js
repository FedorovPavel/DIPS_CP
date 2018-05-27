const mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	Billing = require('./billing');

const OrderSchema = new Schema({
	userId: {
		type: String,
		required: true
	},
	carId: {
		type: String,
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
		from: {
			type: Number,
			required: true
		},
		to: {
			type: Number,
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
					return callback(null, result.toFullObject());
				}
			});
		} else {
			return callback('Unknown fields', null);
		}
	} else {
		return callback('not found required fields', null);
	}
};

OrderSchema.statics.changeOrder = function (id, objectInfo, callback) {
	let object = Object(objectInfo);
	let query = transformOrderQuery(object);
	const that = this;
	return that.findByIdAndUpdate(id, {$set : query}, function (err, order) {
		if (err) {
			return callback(err, null);
		}
		return callback(null, order.toFullObject());
	});
}

OrderSchema.statics.getOrders = function (userId, page = 0, count = 20, callback) {
	page = Number(page);
	count = Number(count);
	return this.find({ userId: userId }, function (err, orders) {
		if (err)
			return callback(err, null);
		else {
			if (orders) {
				let result = [];
				for (let I = 0; I < orders.length; I++) {
					result.push(orders[I].toFullObject());
				}
				return callback(null, result);
			} else {
				return callback(null, null);
			}
		}
	}).skip(page * count).limit(count);
};

OrderSchema.statics.getOrder = function (id, uid, callback) {
	return this.findOne({ _id: id, userId: uid }, function (err, result) {
		if (err)
			return callback(err, null);
		else {
			if (result) {
				return callback(null, result.toFullObject());
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
					order.status = 'Confirm';
					return order.save(function (err, res) {
						if (err)
							return callback(err, null);
						else
							return callback(null, res.toFullObject());
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

OrderSchema.statics.revertConfirm = function (uid, id, callback) {
	return this.findOne({ _id: id, userId: uid }, function (err, order) {
		if (err)
			return callback(err, null);
		else {
			if (order) {
				if (order.status == 'Confirm') {
					order.status = 'Draft';
					return order.save(function (err, res) {
						if (err)
							return callback(err, null);
						else
							return callback(null, res.toFullObject());
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
	const mongoose = require('mongoose');
	const model = mongoose.model('Billing');
	return this.findOne({ _id: id, userId: uid }, function (err, order) {
		if (err)
			return callback(err, null);
		else {
			if (order) {
				if (order.status == 'Confirm') {
					return model.createBilling(info, function(err, billing){
						if (err) {
							return callback(err, null);
						}
						order.status = 'Paid';
						order.billing = billing;
						return order.save(function (err, res) {
							if (err)
								return callback(err, null);
							return callback(null, res.toFullObject());
						});
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
							return callback(null, res.toFullObject());
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

OrderSchema.methods.toFullObject = function () {
	const item = {
		id: this._id.toString(),
		userId: this.userId,
		carId: this.carId,
		status: this.status,
		lease: {
			from: this.lease.from,
			to: this.lease.to
		},
		cost: this.cost,
		created: this.created
	};
	if (this.billing != undefined) {
		item.billing = this.billing.toFullObject();
	}
	return item;
}

const orderORM = mongoose.model('Order', OrderSchema);

const manager = new class {

	getOrders(id, page, count, callback) {
		return orderORM.getOrders(id, page, count, callback);
	}

	getOrder(id, uid, callback) {
		return orderORM.getOrder(id, uid, callback);
	}

	getCount(id, callback) {
		return orderORM.getCount(id, callback);
	}

	createOrder(objectInfo, callback) {
		return orderORM.createOrder(objectInfo, callback);
	}

	changeOrder(id, objectInfo, callback) {
		return orderORM.changeOrder(id, objectInfo, callback);
	}

	changeOrderStatus(uid, id, state, callback, info = undefined) {
		switch (state) {
			case -1: {
				return orderORM.revertConfirm(uid, id, callback);
			}
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

function transformOrderQuery(object) {
	let query = {};
	for (key in object) {
		switch (key) {
			case 'userId':
				query.userId = object[key];
				break;
			case 'carId':
				query.carId = object[key];
				break;
			case 'from':
				query.lease.from = new Date(object[key]).getTime();
				break;
			case 'to':
				query.lease.to = new Date(object[key]).getTime();
				break;
			case 'cost' : 
				query.cost = object[key];
				break;
			case 'created' : 
				query.created = object[key];
				break;
			case 'status': 
				query.status = object[key];
				break;
			default:
				break;
		}
	}
	return query;
}

function createOrder(object) {
	const model = mongoose.model('Order');
	let item = new model();
	let errorParse = false;
	for (key in object) {
		switch (key) {
			case 'userId':
				item.userId = object[key];
				break;
			case 'carId':
				item.carId = object[key];
				break;
			case 'from':
				item.lease.from = new Date(object[key]).getTime();
				break;
			case 'to':
				item.lease.to = new Date(object[key]).getTime();
				break;
			case 'cost' : 
				item.cost = object[key];
				break;
			default:
				errorParse = true;
				break;
		}
	}
	if (errorParse)
		return null;
	item.created = Date.now();
	item.status = 'Draft';
	return item;
}

function checkRequiredFields(objectKeys){
  const keys = Array.from(objectKeys);
  const requiredField = ['userId','carId', 'from', 'to', 'cost'];
  let flag = 0;
  for(let I = 0; I < keys.length; I++ ){
    if (requiredField.indexOf(keys[I]) != -1)
      flag++;
  }
  if (flag == requiredField.length) {
    return true;
  } else {
    return false;
  }
}