var express   = require('express'),
    router    = express.Router(),
    crypto    = require('crypto'),
	appId     = require('./../../config/config').app.id,
	mailApp   = require('../../config/config').mailApp;
    bus       = require('./../coordinator/bus'),
    validator = require('./../validator/validator'),
    amqp      = require('amqplib/callback_api'),
    statSender= require('./../statistics-functions/sender-receiver'),
    interval  = 20000;// 20s to repeate check live
    

module.exports = function (app) {
  app.use('/aggregator', router);
};

function addIdOrderToQueue(id) {
  amqp.connect('amqp://localhost', function(err, conn){
    conn.createChannel(function(err, ch){
      var queue = 'orders_id';
      
      ch.assertQueue(queue, {durable : false});
      ch.sendToQueue(queue, Buffer.from(id),{persistent : true});
      // console.log('Order ID : ' + id + ' push to queue [' + queue + ']');
    });
    setTimeout(function() {conn.close()},500);
  });
}

function receiveIdOrderFromQueue(callback){
  amqp.connect('amqp://localhost', function(err, conn){
    conn.createChannel(function(err, ch){
      var queue = 'orders_id';

      ch.assertQueue(queue, {durable : false});
      ch.consume(queue, function(id){
        const _id = id.content.toString('utf-8');
        // console.log('pop order id: ' + _id + ' from queue ['+queue+']');
        callback(_id);
      }, {noAck : true});
      setTimeout(function(){
        conn.close();
        callback(null);
      },500);
    });
  });
}

setInterval(function(){
  bus.checkOrderService(function(err, status){
    if (status == 200){
      receiveIdOrderFromQueue(function(id){
        if (id){
          bus.orderComplete(id, function(err, status, response){
            if (err)
              addIdOrderToQueue(id);
            else {
              if (status == 200){
                console.log('order with id ['+ id + '] is processed');
              } else if (status == 500) {
                addIdOrderToQueue(id);
              } else {
                console.log('request to complete order with [' + id + '] return status : ' + status + ' response: ');
                console.log(response);
              }
            }
          });
        }
      });
    }
  });
}, interval);

//  Auth
router.get('/auth', function(req, res, next){
  const authUrl = "http://localhost:3001/auth/authorization?";
  const aggregatorUrl = "http://localhost:3000/aggregator/code";
  const queryParametrs = ['response_type=code', 'app_id=' + appId, 'redirect_uri='+ aggregatorUrl];
  const url = authUrl + queryParametrs.join('&');
  return res.status(302).redirect(url);
});

router.get('/registration', function(req, res, next) {
  const authUrl = 'http://localhost:3001/auth/registration?';
  const url = authUrl + 'app_id=' + appId;
  return res.status(302).redirect(url);
});

router.post('/authByToken', function(req, res ,next){
  let getToken = function getBearerToken(req){
    return req.headers.authorization.split(' ')[1];
  }
  const data = {
    ref_token : getToken(req)
  };
  return bus.getTokenByToken(data, function(err, status, response){
    res.status(status).send(response);
    const info = {
      status : status,
      response : response,
      entryData : data
    };
    return;// statSender.sendAuthorizationByTokenInfo(info);
  });
});

router.get('/code', function(req, res, next){
  const code = decodeURIComponent(req.query.code);
  if (!code || typeof(code) == 'undefined' || code.length == 0)
    return res.status(500).send({status : "Service Error", message : "Authorization service did not send code"});
  const info = {
    code : code
  };
  return bus.getTokenByCode(info, function(err, status, response){
    res.status(status).send(response);
    const info = {
      status : status,
      response : response
    };
    return;// statSender.sendAuthorizationInfo(info);
  });
});

//mail auth
router.get('/mailAuth', function(req, res, next){
	const authUrl = "https://connect.mail.ru/oauth/authorize?";
	const aggregatorUrl = "http://23.105.226.186/aggregator/mailCode";
	const queryParametrs = ['client_id='+mailApp.id, 'response_type=code', 'redirect_uri='+aggregatorUrl];
	const url = authUrl + queryParametrs.join('&');
	return res.status(302).redirect(url);
});

router.get('/mailCode', function(req, res, next){
	const code = decodeURIComponent(req.query.code);
	if (!code || typeof(code) == 'undefined' || code.length == 0)
	  return res.status(500).send({status : "Service Error", message : "Authorization service did not send code"});
	const info = {
	  code : code
	};

	return bus.getMailToken(info, function(err, status, response){
	  res.status(status).send(response);
	  bus.saveMailTokensToAuth(response);
	  const info = {
		status : status,
		response : response
	  };
	  return;// statSender.sendAuthorizationInfo(info);
	});
});

  // Get any cars
router.get('/catalog', function(req, res, next){
  let page  = validator.checkPageNumber(req.query.page);
  let count = validator.checkCountNumber(req.query.count);
  let queryParams = getQueryParams(req.query);
  const dataContainer = {
    page : page,
    count : count,
    query: queryParams
  };
  return bus.getCars(dataContainer, function(err, statusCode = 500, responseText){
    return res.status(statusCode).send(responseText);
  });

  /**
   * @param {Object} query 
   */
  function getQueryParams(query) {
    let validQuery = '';
    delete query.page;
    delete query.count;
    let keys = Object.keys(query);
    for(let I = 0; I < keys.length; I++){
      switch(keys[I]) {
        case 'ma': 
        case 'mo':
        case 't':
        case 'tr':
        case 'd':
        case 'p':
        case 'minC':
        case 'maxC':
          validQuery += keys[I] + '=' + query[keys[I]] + '&';
          break;
      }
    }
    if (validQuery.length > 0 && validQuery[validQuery.length - 1] == '&') 
      validQuery = validQuery.slice(0, -1);
    return validQuery;
  }
});

//  Get car by ID
router.get('/catalog/:id', function(req, res, next){
  const id = validator.checkID(req.params.id);
  if (typeof(id) == 'undefined')
    return res.status(400).send({status : 'Error', message : 'Bad request: ID is undefined'});
  const data = {
    id : id
  };
  return bus.getCar(data, function(err, statusCode, responseText){
    return res.status(statusCode).send(responseText);
  });
});

//  Create Order
router.post('/orders/', function(req, res, next){
  return checkAuthAndGetUserInfo(req, res, function(info){
    let param = {};
    param.userId = info.id;
    param.carID = validator.checkID(req.body.carID);
    if (typeof(param.carID) == 'undefined'){
      res.status(400).send({status : 'Error', message : 'Bad request : Invalid car ID'});
      const data = {
        status : 400,
        response : {status : 'Error', message : 'Bad request : Invalid car ID'},
        entryData : param
      };
      return;// statSender.sendInfoByDraftOrder(data);
    }
    param.from = validator.ConvertStringToDate(req.body.from);
    if (!param.from){
      res.status(400).send({status : 'Error', message : 'Bad request : Invalid start rent date'});
      const data = {
        status : 400,
        response : {status : 'Error', message : 'Bad request : Invalid start rent date'},
        entryData : param
      };
      return;// statSender.sendInfoByDraftOrder(data);
    }
    param.to = validator.ConvertStringToDate(req.body.to);
    if (!param.to){
      res.status(400).send({status : 'Error', message : 'Bad request : Invalid end rent date'});
      const data = {
        status : 400,
        response : {status : 'Error', message : 'Bad request : Invalid end rent date'},
        entryData : param
      };
      return;// statSender.sendInfoByDraftOrder(data);
    }
    return bus.getCar({
      id: param.carID
    }, function(err, status, response) {
      if (err || status != 200){
        return res.status(status).send(response);
      }
      param.cost = (Number(param.to.getTime()) - Number(param.from.getTime())) / (24 * 60 * 60 * 1000) * response.cost;
      return bus.createOrder(param, function(err, status, response){
        res.status(status).send(response);
        const data = {
          status : status,
          response : response,
          entryData : param
        };
        return;// statSender.sendInfoByDraftOrder(data);
      });
    });
  });
});

//  Get order
router.get('/orders/:order_id', function(req, res, next){
  return checkAuthAndGetUserInfo(req, res, function(info){
    const data = {
      userId : info.id
    };
    data.order_id = validator.checkID(req.params.order_id);
    if (typeof(data.order_id) == 'undefined')
      return res.status(400).send({status : 'Error', message : 'Bad request: Invalid ID'});
    return bus.getOrder(data, function(err, status, response){
      return res.status(status).send(response);
    });
  });
});

//  Get orders
router.get('/orders', function(req, res, next){
  return checkAuthAndGetUserInfo(req, res, function(info){
    let page  = validator.checkPageNumber(req.query.page);
    let count = validator.checkCountNumber(req.query.count);
    const data = {
      page : page,
      count : count,
      userId : info.id
    };
    return bus.getOrders(data, function(err, status, orders){
      if (err)
        return res.status(status).send(orders);
      else {
        let carsIds = [];
        if (orders && orders.content.orders.length > 0) {
          for (let I = 0; I < orders.content.orders.length; I++){
            const carId = orders.content.orders[I].carId;
            if (carId != 'undefined' && carsIds.indexOf(carId) == -1){
              carsIds.push(carId);
            }
          }
          return bus.getCarList(carsIds.join(','), function(err, status, cars){
            if (err){
              for (let I = 0; I < orders.content.orders.length; I++) {
                delete orders.content.orders[I].carId;
                orders.content.orders[I].Car = 'Неизвестно';
              }
            }
            let index;
            let car;
            carsIds = cars.map(function(val){
              return val.id;
            });
            for (let I = 0; I < orders.content.orders.length; I++) {
              index = carsIds.indexOf(orders.content.orders[I].carId);
              if (index >= 0) {
                orders.content.orders[I].Car = cars[index];
              } else {
                orders.content.orders[I].Car = 'Неизвестно';
              }
              delete orders.content.orders[I].carId;
            }
            return res.status(200).send(orders);
          });
        } else {
          res.status(status).send(null);
        }
      }
    });
  });
});

//  Confirm order
router.put('/orders/confirm/:id', function(req, res, next){
  return checkAuthAndGetUserInfo(req, res, function(info){
    const oid = req.params.id;
    const data = {
      order_id : oid,
      userId : info.id
    };
    return bus.orderConfirm(data, function(err, status, response){
      if (err || status != 200) {
        return res.status(status).send(response);  
      }
      let rentInfo = {
        id: response.carId,
        uid: info.id,
        from: response.lease.from,
        to: response.lease.to
      };
      return bus.rentCar(rentInfo, function(err, status, response) {
        if (err || status != 200) {
          return bus.revertConfirm(data, function(err, status, response) {
            return res.status(status).send(response);
          });
        }
        return res.status(status).send(response);
      });
    });
  });
});

router.put('/orders/paid/:id', function(req, res, next){
  return checkAuthAndGetUserInfo(req, res, function(info){
    const oid = req.params.id;
    const checkData = {
      orderId : oid,
      userId : info.id
    };
    let data = {};
    data.paySystem = validator.checkPaySystem(req.body.paySystem);
    if (typeof(data.paySystem) == 'undefined')
      return res.status(400).send({status : 'Error', message : 'Bad request : PaySystem is undefined'});
    if (!data.paySystem)
      return res.status(400).send({status : 'Error', message : 'Bad request : Invalid PaySystem'});

    data.account = validator.checkAccount(req.body.account);
    if (typeof(data.account)  == 'undefined')
      return res.status(400).send({status : 'Error', message : 'Bad request : Account is undefined'});
    if (!data.account)
      return res.status(400).send({status : 'Error', message : 'Bad request : Invalid Account'});

    return bus.getOrder(checkData, function(err, status, pre_order){
      if (err)
        return res.status(status).send(pre_order);
      if (pre_order && ((pre_order.status == 'Confirm' )||((pre_order.status.toLowerCase() == 'waitforbillings')))){
        let transferData = {
          order_id : oid,
          userId : info.id,
          data: data
        };
        return bus.orderPaid(transferData, function(err, status, response){
          if (err || status != 201)
            return res.status(status).send(response);
          if (response && status == 201){
            return res.status(status).send(response);
          }
        });
      } else {
        return res.status(400).send({status : 'Error', message : "Status don't right"});
      }
    });
  });
});

router.put('/orders/complete/:id', function(req, res, next){
  return checkAuthAndGetUserInfo(req, res, function(info){
    const data = {
      orderId : req.params.id,
      userId  : info.id
    };
    return bus.orderComplete(data, function(err, status, response){
      if (err){
        if (status == 503) {
          addIdOrderToQueue(data);
          return res.status(202).send({status : 'Ok', message : 'Change order status succesfully'});
        }
        return res.status(status).send(response);
      } else {
        return res.status(status).send(response);
      }
    });
  });
});

router.get('/reports/all', function(req, res, next){
  return checkAuthAndGetUserInfo(req, res, function(info){
    if (!info || !info.role || info.role.toLowerCase() != 'admin'){
      return res.status(404).send({status : 'Error' , message : "Page not found"});
    }
    const data = {};
    return bus.getAllReport(data, function(err, status, response){
      return res.status(status).send(response);
    });
  });
});

router.get('/admin/getUserRole', function(req, res, next){
  	return checkAuthAndGetUserInfo(req, res, function(info){
		console.log(info);
		if (!info || !info.role || info.role.toLowerCase() != 'admin'){
			return res.status(404).send({status : 'Error' , message : "Page not found"});
	  	}
	  	const data = {};
		return res.status(200).send({status: 'Ok', role: info.role});
	});
});

function checkAuthAndGetUserInfo(req, res, callback){
  let getToken = function getBearerToken(req){
    return req.headers.authorization.split(' ')[1];
  }
  const info = {
    token : getToken(req)
  }
  if (!info.token || info.token.length == 0 || typeof(info.token) === 'undefined')
    return res.status(401).send({status : 'Non authorize', message : 'Invalid token'});
  return bus.getUserInfo(info, function(err, status, response){
    if (err)
      return res.status(status).send(err);
    if (!response)
      return res.status(status).send('User not found');
    if (status == 401)
      return res.status(status).send(response);
    return callback(response)
  });
}