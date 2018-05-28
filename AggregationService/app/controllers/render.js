var express   = require('express'),
	router    = express.Router(),
	bus       = require('./../coordinator/bus');

module.exports = function (app) {
    app.use('/', router);
};

router.get('/', function(req, res, next){
	res.render('index');
	console.log('rendered index');
});

router.get('/aggregator/admin/carmanager', function(req, res, next){
	const dataContainer = {
		page : 0,
		count : 999999,
		query : ''
	};

	return bus.getCars(dataContainer, function(err, statusCode = 500, carData){
		console.log(JSON.stringify(carData));
		return res.render('carmanager', {cars: carData.content.cars});
	});
});