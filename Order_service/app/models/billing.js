const mongoose = require('mongoose'),
	Schema = mongoose.Schema;

const BillingSchema = new Schema({
	paySystem: String,
	hashedName: String,
	saltName: String,
	hashedAccount: String,
	saltAccount: String,
	cost: {
		type: Number,
		min: 0.0
	},
	created: Date
});

BillingSchema.methods.toObject = function () {
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