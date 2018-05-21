var mongoose  = require('mongoose'),
    Schema    = mongoose.Schema;

var StatSchema = new Schema({
    info  : String,
    counter : {
        type : Number,
        default : 0
    }
});

StatSchema.statics.addRecord = function(info, callback){    
    var model = mongoose.model('StatAuthByToken');
    let record = new model({
        info : info
    });
    return record.save(function(err, recordOnDB){
        if (err)
            return callback(err, null);
        return callback(null, recordOnDB.getRecord());
    });
}

StatSchema.statics.removeRecord = function(id, callback){
    return this.findById(id, function(err, record){
        if (err)
            return callback(err, null);
        if (!record)
            return callback(null, null);
        return record.remove(function(err){
            if (err)
                return callback(err, null);
            return callback(null, true);
        });
    });
}

StatSchema.statics.getByRepeat = function(id, callback){
    return this.findById(id, function(err, record){
        if (err)
            return callback(err, null);
        if (!record)
            return callback(err, null);
        return callback(null, record.getRecord());
    });
}

StatSchema.statics.incrementCounter = function(id, callback){
    return this.findById(id, function(err, record){
        if (err)
            return callback(err, null);
        if (!record)
            return callback(null, null);
        record.counter = record.counter + 1;
        return record.save(function(err, newRecord){
            if (err)
                return callback(err, null);
            if (!newRecord)
                return callback(null, null);
            return callback(null, true);
        });
    });
}

StatSchema.methods.getRecord = function(){
    const data = {
        id      : this.id,
        info    : this.info,
        count   : this.counter
    };
    return data;
}

mongoose.model('StatAuthByToken', StatSchema);