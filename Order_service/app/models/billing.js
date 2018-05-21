const mongoose = require('mongoose'),
	Schema = mongoose.Schema;

const BillingSchema = new Schema({
	paySystem: String,
	account: String,
	cost: {
		type: Number,
		min: 0.0
	},
	created: Number
});

BillingSchema.statics.createBilling = function (info, callback) {
	const model = mongoose.model('Billing');
	let object = transformToObject(info);
	let item = new model(object);
	return item.save(function(err, billing) {
		if (err){
			return callback(err, null);
		}
		return callback(null, billing);
	});
}

BillingSchema.methods.toFullObject = function () {
	const item = {
		id: this._id.toString(),
		paySystem: this.paySystem,
		account: this.hashedAccount,
		cost: this.cost,
		created: this.created
	};
	return item;
}

module.exports.Schema = BillingSchema;

mongoose.model('Billing', BillingSchema);

function transformToObject(info) {
	let object = {};
	for (let key in info) {
		switch(key) {
			case 'paySystem' : 
				object.paySystem = info[key];
				break;
			case 'account':
				object.account = info[key];
				break;
			case 'cost': 
				object.cost = Number(info[key]);
				break;
		}
	}
	object.created = Date.now();
	return object;
}