const   basic       = require('basic-auth'),
        strategy    = require('./../../config/passport-stategy'),
        uuid        = require('uuid').v4,
        crypto      = require('crypto');

const basicType = /basic/i;
const bearerType = /bearer/i;


module.exports = {
    /**
     * Функция проверки авторизации сервиса по заголовку Authorization
     */
    checkServiceAuthorization : function(header_authorization, callback){
        const type = basicType.test(header_authorization);
        //  Если тип авторизации Basic
        if (type){
            return checkBasicAuthorization(header_authorization, callback);
        } else if (bearerType.test(header_authorization)){
            //  Если тип авторизации Bearer token
            return checkBearerAuthorization(header_authorization, callback);
        }
        return callback('Unknown authorization type', 400, null);
    },
    /**
     * @param {Object} data - data
     */
    getUserCode : function(data, callback){
        const valid = checkResponseType(data.responseType, 'code');
        if (!valid)
            return callback('Invalid response_type', 400, null);
        return strategy.checkServiceById(data.appId, function(err, status, response){
            if (err)
                return callback(err, status, response);
            if (!response)
                return callback(err, status, null);
            return strategy.getUserCode(data.login, data.password, function(err, status, code){
                return callback(err, status, code);
            });
        });
    },
    /**
     * Установка token'ов для пользователя
     */
    setUserTokenByCode : function(code, callback){
        return strategy.createTokenForUser(code, function(err, status, scope){
            if (err)
                return callback(err, status, null);
            if (!scope)
                return callback(null, status, null);
            return callback(null, null, scope);
        });
    },
    setUserTokenByToken : function(token, callback){
        return strategy.createTokenForUserByToken(token, function(err, status, scope){
            if (err)
                return callback(err, status, null);
            if (!scope)
                return callback(null, status, null);
            return callback(null, null, scope);
        });
    },
    checkUserByBearer : function(header_text , callback){
        if (!bearerType.test(header_text))
            return callback('Is not Bearer token', 400, null);
        const token = getBearer(header_text);
        return strategy.checkUserByAccessToken(token, function(err, status, user){
            if (err)
                return callback(err, status);
            if (status || !user)
                return callback('User not found', status);
            return callback(null, status, user);
        });
    },
    createUser: function (info, role, callback) {
        let item = {
            login: info.login,
            password: info.password,
            role: role,
            code: crypto.randomBytes(10).toString('base64')
        };
        return strategy.createUser(item, callback);
    }
}

//  Проверка авторизации сервиса по Basic аутентификации
function checkBasicAuthorization(header_authorization, callback){
    //  Получаем app.name и app.pass
    const service = basic.parse(header_authorization);
    //  Проверяем сервис с данными name и pass
    return strategy.checkService(service.name, service.pass, function(err, status, application){
        if (err)
            return callback(err, status, null);
        if (!application)
            return callback(null, status, null);
        //  Так как авторизация происходила по логину/паролю выдать токен
        return strategy.setNewAccessTokenToApp(application, function(err, status, scope){
            if (err)
                return callback(err, status, null);
            if (!scope)
                return callback(null, status, null);
            return callback(null, null, scope);
        });
    });
}

function checkBearerAuthorization(header_authorization, callback){
    const serviceToken = getBearer(header_authorization);
    return strategy.checkServiceAccessToken(serviceToken, function(err, status, result){
        if (err)
            return callback(err, status, null);
        return callback(null, status, result);
    });
}

function checkResponseType(type, needed_type){
    if (type === needed_type)
        return true;
    return false;
}

function getBearer(token){
  token = String(token);
  token = token.slice(7);
  return token;
}