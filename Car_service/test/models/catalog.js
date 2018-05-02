process.env.NODE_ENV = 'test';

const chai = require('chai');
const server = require('./../../app.js');

const mongoose = require('mongoose');
const model = mongoose.model('catalog');
const manager = require('./../../app/models/catalog');

beforeEach((done) => {
	model.remove({}, (err) => {
		if (err)
			return;
		done();
	});
});

describe('Test catalog model', () => {
	describe('test document', () => {
		it('valid document', (done) => {
			let doc = new model({
				manufacture: "Test",
				model: "testModel",
				type: 'sedan',
				doors: 2,
				person: 2,
				transmission: 'auto',
				cost: 100
			});
			doc.validate((err) => {
				chai.expect(err).not.exist;
				done();
			});
		});
		it("manufacture is undefined", (done) => {
			let doc = new model({
				type: 'sedan',
				model: "testModel",
				doors: 2,
				person: 2,
				transmission: 'auto',
				cost: 100
			});
			doc.validate((err) => {
				chai.expect(err.errors.manufacture).to.exist;
				done();
			});
		});
		it("type is undefined", (done) => {
			let doc = new model({
				manufacture: "Test",
				model: "testModel",
				doors: 2,
				person: 2,
				transmission: 'auto',
				cost: 100
			});
			doc.validate((err) => {
				chai.expect(err).not.exist;
				done();
			});
		});
		it("person is undefined", (done) => {
			let doc = new model({
				manufacture: "Test",
				model: "testModel",
				type: "SUV",
				doors: 2,
				transmission: 'auto',
				cost: 100
			});
			doc.validate((err) => {
				chai.expect(err).not.to.exist;
				done();
			});
		});
		it("transmission is undefined", (done) => {
			let doc = new model({
				manufacture: "Test",
				model: "testModel",
				type: "SUV",
				person: 10,
				doors: 2,
				cost: 100
			});
			doc.validate((err) => {
				chai.expect(err.errors.transmission).to.exist;
				done();
			});
		});
		it("cost is undefined", (done) => {
			let doc = new model({
				manufacture: "Test",
				model: "testModel",
				type: "SUV",
				person: 10,
				doors: 2,
				transmission: 'auto',
			});
			doc.validate((err) => {
				chai.expect(err.errors.cost).to.exist;
				done();
			});
		});
	});
	describe("test saveDocument", () => {
		it('save valid document', (done) => {
			let doc = new model({
				manufacture: "Test",
				model: "testModel",
				type: 'sedan',
				doors: 2,
				person: 2,
				transmission: 'auto',
				cost: 100
			});
			doc.validate((err) => {
				chai.expect(err).not.exist;
				model.saveDocument(doc, (err, sdoc) => {
					chai.expect(err).to.equal(null);
					chai.expect(sdoc).to.equal(doc);
					done();
				});
			});
		});
		it("save invalid document", (done) => {
			let doc = new model({
				manufacture: "Test",
				model: "testModel",
				type: "eee",
				person: 10,
				doors: 2,
				transmission: 'auto',
			});
			doc.validate((err) => {
				chai.expect(err.errors.cost).to.exist;
				chai.expect(err.errors.type).to.exist;
				model.saveDocument(doc, (err, sdoc) => {
					chai.expect(err.errors.cost).to.exist;
					chai.expect(err.errors.type).to.exist;
					chai.expect(sdoc).to.equal(null);
					done();
				});
			});
		});
	});
	describe("test getCars", () => {
		it('get in empty db', (done) => {
			model.getCars(0, 10, (err, result) => {
				chai.expect(err).not.exist;
				chai.expect(result.length).to.equal(0);
				done();
			});
		});
		it("get first 5 exist records", (done) => {
			generator(5, (cars) => {
				model.getCars(0, 5, (err, result) => {
					chai.expect(err).not.exist;
					chai.expect(result.length).to.equal(5);
					cars.sort(function (a, b) {
						return a.manufacture > b.manufacture;
					});
					result.sort(function (a, b) {
						return a.manufacture > b.manufacture;
					});
					for (let I = 0; I < 5; I++) {
						chai.expect(result[I].manufacture).to.equal(cars[I].manufacture);
					}
					done();
				});
			});
		});
		it("get 2-3 exist records", (done) => {
			generator(5, (cars) => {
				model.getCars(2, 2, (err, result) => {
					chai.expect(err).not.exist;
					chai.expect(result.length).to.equal(2);
					cars.sort(function (a, b) {
						return a.manufacture > b.manufacture;
					});
					result.sort(function (a, b) {
						return a.manufacture > b.manufacture;
					});
					for (let I = 0; I < 2; I++) {
						chai.expect(result[I].manufacture).to.equal(cars[I + 2].manufacture);
					}
					done();
				});
			});
		});
		it("invalid searching", (done) => {
			generator(5, (cars) => {
				model.getCars(-2, -2, (err, result) => {
					chai.expect(err.name).to.exist;
					chai.expect(err.name).to.equal("MongoError");
					chai.expect(err.code).to.exist;
					chai.expect(err.code).to.equal(2);
					chai.expect(result).to.equal(null);
					done();
				});
			});
		});
	});
	describe("test getCount", () => {
		it('get in empty db', (done) => {
			model.getCount((err, result) => {
				chai.expect(err).not.exist;
				chai.expect(result).to.equal(0);
				done();
			});
		});
		it("get with 5 exist records", (done) => {
			generator(5, (cars) => {
				model.getCount((err, result) => {
					chai.expect(err).not.exist;
					chai.expect(result).to.equal(5);
					done();
				});
			});
		});
	});
	describe('test getObject', () => {
		it('valid test', (done) => {
			let doc = new model({
				manufacture: "Test",
				model: "testModel",
				type: 'sedan',
				doors: 2,
				person: 2,
				transmission: 'auto',
				cost: 100
			});
			doc.validate((err) => {
				chai.expect(err).not.exist;
				let object = doc.getObject();
				for(key in object) {
					if (typeof (object[key]) != 'object') 
						chai.expect(object[key]).to.equal(doc[key]);
					else {
						chai.expect(object[key].length).to.equal(doc[key].length);
					}
				}
				done();
			});
		});
	});
	describe('test middleware getCars', () => {
		it('get in empty db', (done) => {
			manager.getCars(0, 10, (err, result) => {
				chai.expect(err).to.exist;
				chai.expect(result).to.equal(undefined);
				done();
			});
		});
		it('get without params', (done) => {
			generator(15, (cars) => {
				manager.getCars(undefined, undefined, (err, result) => {
					chai.expect(err).not.exist;
					chai.expect(result.length).to.equal(10);
					done();
				});
			});
		});
		it("get first 5 exist records", (done) => {
			generator(5, (cars) => {
				manager.getCars(0, 5, (err, result) => {
					chai.expect(err).not.exist;
					chai.expect(result.length).to.equal(5);
					cars.sort(function (a, b) {
						return a.manufacture > b.manufacture;
					});
					result.sort(function (a, b) {
						return a.manufacture > b.manufacture;
					});
					for (let I = 0; I < 5; I++) {
						chai.expect(result[I].manufacture).to.equal(cars[I].manufacture);
					}
					done();
				});
			});
		});
		it("get 2-3 exist records", (done) => {
			generator(5, (cars) => {
				manager.getCars(1, 2, (err, result) => {
					chai.expect(err).not.exist;
					chai.expect(result.length).to.equal(2);
					cars.sort(function (a, b) {
						return a.manufacture > b.manufacture;
					});
					result.sort(function (a, b) {
						return a.manufacture > b.manufacture;
					});
					for (let I = 0; I < 2; I++) {
						chai.expect(result[I].manufacture).to.equal(cars[I + 2].manufacture);
					}
					done();
				});
			});
		});
		it("invalid searching", (done) => {
			generator(5, (cars) => {
				manager.getCars(-2, 2, (err, result) => {
					chai.expect(err.name).to.exist;
					chai.expect(err.name).to.equal("MongoError");
					chai.expect(err.code).to.exist;
					chai.expect(err.code).to.equal(2);
					chai.expect(result).to.equal(null);
					done();
				});
			});
		});
	});
	describe("test middleware getCount", () => {
		it('get in empty db', (done) => {
			manager.getCount((err, result) => {
				chai.expect(err).not.exist;
				chai.expect(result).to.equal(0);
				done();
			});
		});
		it("get with 5 exist records", (done) => {
			generator(15, (cars) => {
				manager.getCount((err, result) => {
					chai.expect(err).not.exist;
					chai.expect(result).to.equal(15);
					done();
				});
			});
		});
	});
});

function generator(number, cb) {
	let arr = [];
	for (let I = 0; I < number; I++) {
		arr.push(new Promise((resolve, reject) => {
			let doc = new model({
				manufacture: "Test" + I,
				model: "testModel",
				type: "SUV",
				person: 1 + I,
				doors: Math.ceil(Math.random() * (4 - 1) + 1),
				transmission: 'auto',
				cost: 10 + (1 * I)
			});
			model.saveDocument(doc, (err, sdoc) => {
				if (err)
					return reject(err);
				return resolve(sdoc);
			});
		}));
	}
	Promise.all(arr).then(
		result => {
			return cb(result);
		},
		err => {
			return cb();
		});
}