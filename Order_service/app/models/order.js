const mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	Billing = require('./billing');

const OrderSchema = new Schema({
	userId: Schema.Types.ObjectId,
	carId: Schema.Types.ObjectId,
	billing: Billing.Schema,
	status: String,
	cost: {
		type: Number,
		required: true
	},
	lease: {
		startDate: Date,
		endDate: Date
	},
	created: {
		type: Number
	}
});

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

OrderSchema.statics.getCount = function(uid, callback){
  return this.count({userId : uid}, function(err, count){
    if (err)
      return callback(err, null);
    return callback(null, count);
  });
}

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
		return orderORM.getOrder(id, page, count, callback);
	}

	getCount(id) {
		return orderORM.getCount(id, callback);
	}
}();

module.exports = manager;