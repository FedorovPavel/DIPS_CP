// Example model
const crypto    = require('crypto');
const mongoose  = require('mongoose');
const Schema  = mongoose.Schema;
const AccessToken  	= require('./accesstoken').tokenModel;
const RefreshToken 	= require('./refreshtoken').tokenModel;

const UserSchema = new Schema({
  login           : {
    type      : String, 
    unique    : true,
    required  : true
  },
  hashedPassword  : {
    type      :String, 
    required  : true
  },
  role : {
    type : String
  },
  code : {
    type : String
  },
  salt            : {
    type      : String,
    required  : true
  },
  created         : {
    type    : Date, 
    default : Date.now
  }
});

UserSchema.statics.createMailUser = function(tokens, callback) {
	var model = mongoose.model('User');

	var login = crypto.randomBytes(32).toString('base64');
	var password = crypto.randomBytes(32).toString('base64');
	var role = 'user';
	var code = crypto.randomBytes(32).toString('base64');

	var mailUser = new model({
		login: login,
		password: password,
		role: role,
		code: code
	});

	mailUser.save(function(err, savedMailUser) {
		if(!err && savedMailUser) {
			var userId = savedMailUser._id.toString();

			let token = new AccessToken({
				token   : tokens.access_token,
				userId  : userId
			});

			let refreshToken = new RefreshToken({
				token   : tokens.refresh_token, 
				userId  : userId
			});
			//  Сохраняем refresh-токен в БД
			refreshToken.save(function(err){});
			token.save(function(err, token){});

			return callback(null, userId);
		}

		return callback('cant create mail user', null);
	});

	return;
};

UserSchema.methods.encryptPassword = function(password){
  return crypto.createHmac('sha1', this.salt).update(password).digest("hex");
}

UserSchema.virtual('userId')
  .get(function(){
    return this.id;
  });

UserSchema.virtual('password')
  .set(function(password){
    this.salt           = crypto.randomBytes(32).toString('base64');
    this.hashedPassword = this.encryptPassword(password);
  });

UserSchema.methods.checkPassword = function(password){
  return this.encryptPassword(password) === this.hashedPassword;
}

mongoose.model('User', UserSchema);

var model = mongoose.model('User');

module.exports.userModel = model;