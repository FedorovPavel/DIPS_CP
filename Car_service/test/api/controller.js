process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('./../../app');
const should = chai.should();
const mongoose = require('mongoose');

const manager = require('./../../app/models/catalog');
const model = mongoose.model('catalog');

chai.use(chaiHttp);

beforeEach((done) => {
	model.remove({}, (err) => {
		chai.expect(err).not.exist;
		done();
	})
})

describe('controller', () => {
	describe('get car : /', () => {
		it('valid request without params', (done) => {
			generate(20, (cars) => {
				chai.request(server)
					.get('/cars')
					.end((err, res) => {
						res.status.should.equal(200);
						res.should.to.be.json;
						let json = res.body;
						json.status.should.to.equal('Ok');
						json = json.content;
						json.info.limit.should.to.equal(10);
						json.info.current.should.to.equal(0);
						json.info.pages.should.to.equal(1);
						json.info.count.should.to.equal(20);
						cars.sort((a, b) => { if (a.cost > b.cost) return 1; return -1; });
						json = json.cars;
						json.sort((a, b) => { if (a.cost > b.cost) return 1; return -1; });
						for (let I = 0; I < 9; I++) {
							json[I].manufacture.should.equal(cars[I].manufacture);
						}
						done();
					});
			});
		});
		it('valid request with page', (done) => {
			generate(20, (cars) => {
				chai.request(server)
					.get('/cars/?page=1')
					.end((err, res) => {
						res.status.should.equal(200);
						res.should.to.be.json;
						let json = res.body;
						json.status.should.to.equal('Ok');
						json = json.content;
						json.info.limit.should.to.equal(10);
						json.info.current.should.to.equal(1);
						json.info.pages.should.to.equal(1);
						json.info.count.should.to.equal(20);
						cars.sort((a, b) => { if (a.cost < b.cost) return 1; return -1; });
						json = json.cars;
						json.sort((a, b) => { if (a.cost < b.cost) return 1; return -1; });
						for (let I = 0; I < 9; I++) {
							json[I].manufacture.should.equal(cars[I].manufacture);
						}
						done();
					});
			});
		});
	});
});

function generate(count, cb) {
	let actions = [];
	for (let I = 0; I < count; I++) {
		actions.push(new Promise((resolve, reject) => {
			let doc = new model({
				manufacture: "Test" + I,
				model: "testModel",
				type: "sedan",
				person: 1 + I,
				doors: Math.ceil(Math.random() * (5 - 1) + 1),
				transmission: 'manual',
				cost: 100 + (1 * I)
			});
			model.saveDocument(doc, (err, sdoc) => {
				if (err)
					return reject(err);
				return resolve(sdoc);
			});
		}));
	}
	Promise.all(actions).then(
		result => { return cb(result); },
		error => { return cb(); }
	);
}