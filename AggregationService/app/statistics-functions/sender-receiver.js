const mongoose  = require("mongoose"),
      amqp      = require("amqplib/callback_api"),
      config    = require('./../../config/config'),
      timeoutStep = config.app.timeout,
      repeatCount = config.app.repeat;

module.exports = {
    sendAuthorizationInfo : function(info){
        const model = mongoose.model('StatAuthByCode');
        info = JSON.stringify(info);
        return model.addRecord(info, function(err, container){
            if (err){
                console.log('DB error : ');
                console.log(err);
                return;
            }
            if (!container){
                console.log("DB error : don't create record");
                return;
            }
            const id = container.id;
            delete container.id;
            delete container.count;
            bindForTimeOut(id, checkRecordByAuthCode);
            pushToQueueAuthByCode(id, JSON.stringify(container));
            return;
        });
    },
    sendAuthorizationByTokenInfo : function(info){
        const model = mongoose.model('StatAuthByToken');
        info = JSON.stringify(info);
        return model.addRecord(info, function(err, container){
            if (err){
                console.log('DB error : ');
                console.log(err);
                return;
            }
            if (!container){
                console.log("DB error : don't create record");
                return;
            }
            const id = container.id;
            delete container.id;
            delete container.count;
            bindForTimeOut(id, checkRecordByAuthToken);
            pushToQueueAuthByToken(id, JSON.stringify(container));
            return;
        });
    },
    sendInfoByDraftOrder : function(info){
        const model = mongoose.model('StatInfoByDraftOrder');
        info = JSON.stringify(info);
        return model.addRecord(info, function(err, container){
            if (err){
                console.log('DB error : ');
                console.log(err);
                return;
            }
            if (!container){
                console.log("DB error : don't create record");
                return;
            }
            const id = container.id;
            delete container.id;
            delete container.count;
            bindForTimeOut(id, checkRecordByAuthToken);
            pushToQueueDraftOrder(id, JSON.stringify(container));
            return;
        });
    }
}

function bindForTimeOut(id, handler){
    let db_id = id;
    setTimeout(function(){
        handler(id);
    }, timeoutStep);
}

function pushToQueueAuthByCode(id, info){
    let reply = function(msg){
        const model = mongoose.model('StatAuthByCode');
        const message = JSON.parse(Buffer.from(msg.content).toString("utf-8"));
        const id = msg.properties.correlationId;
                if (message.state == "OK"){
                    return model.removeRecord(id, function(err, result){
                        if (err)
                            return console.log("FAIL to remove record");
                        if (result == true){
                            console.log('Record :' + id + " by AuthCode successfully processed on statistics server");
                            return console.log("Record : "+ id+ " successfully removed from DB");
                        }
                    });
                } else {
                    return model.removeRecord(id, function(err, result){
                        if (err)
                            return console.log("FAIL to remove record");
                        if (result == true){
                            console.log('Record :' + id + " by AuthCode have status : "+message.state+" after processed on statistics server");
                            console.log('Detail info:');
                            console.log(message.descriptions);
                            return console.log("Record : "+ id+ " successfully removed from DB");
                        }
                    });
                }
    }
    const queue = "authCode";
    amqp.connect('amqp://localhost', function(err, conn){
        conn.createChannel(function(err, ch){
            ch.assertQueue('', {}, function(err, q){
                ch.consume(q.queue, function(msg){
                   reply(msg);
                }, {noAck : true});
                ch.sendToQueue(queue, new Buffer(info),{
                    correlationId : id,
                    replyTo : q.queue
                });
                console.log('Record id: ' + id + ' push to queue ['+queue+']');
            });
        });
    });
}

function pushToQueueAuthByToken(id, info){
    let reply = function(msg){
        const model = mongoose.model('StatAuthByToken');
        const message = JSON.parse(Buffer.from(msg.content).toString("utf-8"));
        const id = msg.properties.correlationId;
        if (message.state == "OK"){
            console.log('Record :' + id + " by AuthToken successfully processed on statistics server");
            return model.removeRecord(id, function(err, result){
                if (err)
                    return console.log("FAIL to remove record");
                if (result == true){
                    return console.log("Record : "+ id+ " successfully removed from DB");
                }
            });
        } else {
            console.log('Record :' + id + " by AuthToken have status : "+message.state+" after processed on statistics server");
            console.log('Detail info:');
            console.log(message.description);
            return model.removeRecord(id, function(err, result){
                if (err)
                    return console.log("FAIL to remove record");
                if (result == true){
                    return console.log("Record : "+ id+ " successfully removed from DB");
                }
            });
        }
    }
    const queue = 'authToken';
    amqp.connect('amqp://localhost', function(err, conn){
        conn.createChannel(function(err, ch){
            ch.assertQueue('', {}, function(err, q){
                ch.consume(q.queue, function(msg){
                    reply(msg);
                }, {noAck : true});
                ch.sendToQueue(queue, new Buffer(info),{
                    correlationId : id,
                    replyTo : q.queue
                });
                console.log('Record id: ' + id + ' push to queue ['+queue+']');
            });
        });
    });
}

function pushToQueueDraftOrder(id, info){
    var queue = 'draftOrder';
    let reply = function(msg){
        const model = mongoose.model('StatInfoByDraftOrder');
        const message = JSON.parse(Buffer.from(msg.content).toString("utf-8"));
        const id = msg.properties.correlationId;
        if (message.state == "OK"){
            console.log('Record :' + id + " by DraftOrder successfully processed on statistics server");
            return model.removeRecord(id, function(err, result){
                if (err)
                    return console.log("FAIL to remove record");
                if (result == true){
                    return console.log("Record : "+ id+ " successfully removed from DB");
                }
            });
        } else {
            console.log('Record :' + id + " by DraftOrder have status : "+message.state+" after processed on statistics server");
            console.log('Detail info:');
            console.log(message.descriptions);
            return model.removeRecord(id, function(err, result){
                if (err)
                    return console.log("FAIL to remove record");
                if (result == true){
                    return console.log("Record : "+ id+ " successfully removed from DB");
                }
            });
        }
    };
    amqp.connect('amqp://localhost', function(err, conn){
        conn.createChannel(function(err, ch){
            ch.assertQueue('', {}, function(err, q){
                ch.consume(q.queue, function(msg){
                    reply(msg);
                }, {noAck : true});
                ch.sendToQueue(queue, new Buffer(info),{
                    correlationId : id,
                    replyTo : q.queue
                });
                console.log('Record id: ' + id + ' push to queue ['+queue+']');
            });
        });
    });
}

function checkRecordByAuthCode(id){
    const model = mongoose.model('StatAuthByCode');
    return model.getByRepeat(id, function(err, record){
        if (err)
            return console.log(err);
        if (record != null){
            console.log("TimeOut for record : " + id);
            if (record.count < repeatCount){
                return model.incrementCounter(id, function(err, state){
                    if (err)
                        return console.log(err);
                    if (!state)
                        return console.log('fail to increment');
                    bindForTimeOut(id, checkRecordByAuthCode);
                    delete record.count;
                    delete record.id;
                    return pushToQueueAuthByCode(id, JSON.stringify(record));
                });
            }else {
                console.log("Record :" + id +" exceeded the number of redirects");
                // return model.removeRecord(id, function(err, state){
                //     if (err)
                //         return console.log(err);
                //     if (!state){
                //         return console.log('Record not found or can not remove');
                //     }
                //     return console.log('Record successfully removed');
                // });
            }
        }
    });
}

function checkRecordByAuthToken(id){
    const model = mongoose.model('StatAuthByToken');
    return model.getByRepeat(id, function(err, record){
        if (err)
            return console.log(err);
        if (record != null){
            console.log("Statistics by refreshToken : TimeOut for record : " + id);
            if (record.count < repeatCount){
                return model.incrementCounter(id, function(err, state){
                    if (err)
                        return console.log(err);
                    if (!state)
                        return console.log('fail to increment');
                    bindForTimeOut(id, checkRecordByAuthToken);
                    delete record.count;
                    delete record.id;
                    return pushToQueueAuthByToken(id, JSON.stringify(record));
                });
            }else {
                console.log("Record :" + id +" exceeded the number of redirects");
                // return model.removeRecord(id, function(err, state){
                //     if (err)
                //         return console.log(err);
                //     if (!state){
                //         return console.log('Record not found or can not remove');
                //     }
                //     return console.log('Record successfully removed');
                // });
            }
        }
    });
}

function checkRecordByDraftOrder(id){
    const model = mongoose.model('StatAuthByToken');
    return model.getByRepeat(id, function(err, record){
        if (err)
            return console.log(err);
        if (record != null){
            console.log("Statistics by refreshToken : TimeOut for record : " + id);
            if (record.count < repeatCount){
                return model.incrementCounter(id, function(err, state){
                    if (err)
                        return console.log(err);
                    if (!state)
                        return console.log('fail to increment');
                    bindForTimeOut(id, checkRecordByDraftOrder);
                    delete record.count;
                    delete record.id;
                    return pushToQueueDraftOrder(id, JSON.stringify(record));
                });
            }else {
                console.log("Record :" + id +" exceeded the number of redirects");
                // return model.removeRecord(id, function(err, state){
                //     if (err)
                //         return console.log(err);
                //     if (!state){
                //         return console.log('Record not found or can not remove');
                //     }
                //     return console.log('Record successfully removed');
                // });
            }
        }
    });
}