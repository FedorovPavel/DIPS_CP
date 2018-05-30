const mongoose  = require("mongoose"),
      amqp      = require("amqplib/callback_api");


let initHandlerAuthCode = function(){
    amqp.connect('amqp://localhost', function(err, conn){
        conn.createChannel(function(err, ch){
            var queue = 'authCode';
            ch.assertQueue(queue, {durable: false});
            ch.prefetch(10);
            ch.consume(queue, function reply(msg) {
                ProccesedAuthCodeRecord(msg, function(response){
                    const res = JSON.stringify(response);
                    setTimeout(function(){
                        ch.sendToQueue(
                            msg.properties.replyTo,
                            new Buffer(res),
                            {
                                correlationId: msg.properties.correlationId
                            }
                        );
                        ch.ack(msg);
                    }, 60000);
                });
            });
        });
    });
}();

let initHandlerAuthToken = function(){
    amqp.connect('amqp://localhost', function(err, conn){
        conn.createChannel(function(err, ch){
            var queue = 'authToken';
            ch.assertQueue(queue, {durable: false});
            ch.prefetch(10);
            ch.consume(queue, function reply(msg) {
                ProccesedAuthTokenRecord(msg, function(response){
                    const res = JSON.stringify(response);
                    ch.sendToQueue(
                        msg.properties.replyTo,
                        new Buffer(res),
                        {
                            correlationId: msg.properties.correlationId
                        }
                    );
                    ch.ack(msg);
                });
            });
        });
    });
}();

let initHandlerDraftOrder = function(){
    amqp.connect('amqp://localhost', function(err, conn){
        conn.createChannel(function(err, ch){
            var queue = 'draftOrder';
            ch.assertQueue(queue, {durable: false});
            ch.prefetch(10);
            ch.consume(queue, function reply(msg) {
                ProccesedDraftOrderRecord(msg, function(response){
                    const res = JSON.stringify(response);
                    ch.sendToQueue(
                        msg.properties.replyTo,
                        new Buffer(res),
                        {
                            correlationId: msg.properties.correlationId
                        }
                    );
                    ch.ack(msg);
                });
            });
        });
    });
}();

function ProccesedAuthCodeRecord(msg, callback){
    const model = mongoose.model('AuthCodeInfo');
    const message = JSON.parse(JSON.parse(Buffer.from(msg.content).toString("utf-8")).info);
    const id = msg.properties.correlationId;
    let response = {};
    return model.checkRecord(id, function(err, record){
        if (err)
            return console.log("DB ERROR");
        if (record == false){
            let data = {
                messageId : id,
                message : JSON.stringify(message)
            };
            if (message.status && message.status == 200){
                data.state = "OK";
                data.description = '';
                response.state = "OK";
                return model.addRecord(data, function(err, result){
                    if (err && err.code == 11000){
                        console.log('AuthCodeInfo : OK for id :' + id);
                        return callback(response);
                    } else if (err) {
                        console.log('DB error');
                    }
                    console.log('AuthCodeInfo : OK for id :' + id);
                    return callback(response);
                });
            } else {
                console.log('AuthCodeInfo : ERROR for id :' + id);
                response.state = "ERROR";
                response.description = "Invalid message status or undefined";
                data.state = "ERROR";
                data.description = "Invalid message status or undefined";
                return model.addRecord(data, function(err, result){
                    if (err && err.code == 11000){
                        return callback(response);
                    } else if (err){
                        return console.log("DB ERROR");
                    }
                    return callback(response);
                });
            }
        } else {
            response.state = record.state;
            if (response.state != "OK")
                response.description = record.description;
            return callback(response);
        }
    })
};

function ProccesedAuthTokenRecord(msg, callback){
    const model = mongoose.model('AuthTokenInfo');
    const message = JSON.parse(JSON.parse(Buffer.from(msg.content).toString("utf-8")).info);
    const id = msg.properties.correlationId;
    let response = {};
    return model.checkRecord(id, function(err, record){
        if (err)
            return console.log("DB ERROR");
        if (record == false){
            let data = {
                messageId : id,
                message : JSON.stringify(message)
            };
            if (message.status && message.status == 200){
                data.state = "OK";
                data.description = "";
                response.state = "OK";
                console.log('AuthTokenInfo : OK for id :' + id);
                return model.addRecord(data, function(err, result){
                    if (err && err.code == 11000){
                        return callback(response);
                    } else if (err){
                        return console.log("DB ERROR");   
                    }
                    return callback(response);
                });
            } else {
                console.log('AuthTokenInfo : ERROR for id :' + id);
                response.state = "ERROR";
                response.description = "Invalid message status or undefined";
                data.state = "ERROR";
                data.description = "Invalid message status or undefined";
                return model.addRecord(data, function(err, result){
                    if (err && err.code == 11000){
                        return callback(response);
                    } else if (err)    
                        return console.log("DB ERROR");   
                    return callback(response);
                });
            }
        } else {
            response.state = record.state;
            if (response.state != "OK")
                response.description = record.description;
            return callback(response);
        }
    });
};

function ProccesedDraftOrderRecord(msg, callback){
    const model     = mongoose.model('DraftOrderInfo');
    const message   = JSON.parse(JSON.parse(Buffer.from(msg.content).toString("utf-8")).info);
    const id        = msg.properties.correlationId;
    let response    = {};
    return model.checkRecord(id, function(err, record){
        if (err)
            return console.log("DB ERROR");
        if (record == false){
            let data = {
                messageId : id,
                message : JSON.stringify(message)
            };
            let state = validateOrder(message);
            if (!state){
                response.state = "OK";
                data.state = "OK";
                data.description = "";
                console.log('DraftOrderInfo : OK for id :' + id);
                return model.addRecord(data, function(err, result){
                    if (err && err.code == 11000){
                        return callback(response);
                    }else if (err)
                        return console.log('DB ERROR');
                    return callback(response);
                });
            } else {
                console.log('DraftOrderInfo : ERROR for id :' + id);
                response.state = "ERROR";
                response.description = state;

                data.state = "ERROR";
                data.description = state;
                return model.addRecord(data, function(err, result){
                    if (err && err.code == 11000)
                        return callback(response);
                    else if (err)
                        return console.log("DB ERROR");
                    return callback(response);
                });
            }
        } else {
            response.state = record.state;
            if (response.state != "OK")
                response.description = record.state;
            return callback(response);
        }
    });
};

function validateOrder(info){
    const date = /\d{4}-\d{2}-\d{2}/;
    const status = "Draft";
    let res = "";
    if (info.status != 201)
        res += 'Invalid message: ';
    if (typeof(info.response.carId) == 'undefined')
        return res += 'carId is undefined';
    if (typeof(info.response.userId) == 'undefined')
        return res += 'userId is undefined';
    if (!date.test(info.response.lease.from))
        return res += 'Invalid Start Date';
    if (!date.test(info.response.Lease.to))
        return res += 'Invalid End Date';
    if (info.response.Status != status)
        return res += 'Invalid order Status';
    return null;
}