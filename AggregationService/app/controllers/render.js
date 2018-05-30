var express   = require('express'),
	router    = express.Router(),
	bus       = require('./../coordinator/bus');

module.exports = function (app) {
	app.use('/aggregator', router);
};

router.get('/', function(req, res, next){
	if(!req.query.mailResponse)
		res.render('index');
	else
		res.render('index', {
			isRedirectFromMail : true,
			mailResponse: JSON.parse(req.query.mailResponse)
		});

	console.log('rendered index');
});

router.get('/admin/carmanager', function(req, res, next){
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

router.get('/mailCode', function(req, res, next){
	const code = decodeURIComponent(req.query.code);
	if (!code || typeof(code) == 'undefined' || code.length == 0)
	  return res.status(500).send({status : "Service Error", message : "Authorization service did not send code"});
	const info = {
	  code : code
	};

	return bus.getMailToken(info, function(err, status, response){
		res.redirect('/aggregator?mailResponse='+JSON.stringify(response));
	  	bus.saveMailTokensToAuth(response);
	});
});