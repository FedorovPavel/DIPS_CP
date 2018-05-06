const mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	Billing = require('./billing');

const OrderSchema = new Schema({
	UserId: Schema.Types.ObjectId,
	CarId: Schema.Types.ObjectId,
	Billing: Billing.Schema,
	Status: String,
	Cost: {
		type: Number,
		required: true
	},
	Lease: {
		StartDate: Date,
		EndDate: Date
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

OrderSchema.methods.toObject = function () {
	const item = {
		id: this._id.toString(),
		userId: this.UserId,
		carId: this.CarId,
		billing: this.Billing.toObject(),
		status: this.Status,
		lease: {
			startDate: this.lease.StartDate,
			endDate: this.lease.EndDate
		},
		created: this.created
	};
	return item;
}

mongoose.model('Order', OrderSchema);