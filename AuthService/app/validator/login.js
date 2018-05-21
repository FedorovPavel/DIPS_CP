module.exports = {
    /**
     * @param {string} type - тип
     */
    checkResponseType : function(type){
        if (!type || typeof(type) == "undefined" || type.length == 0)
            return null;
        if (type == "code")
            return "code";
        if (type == "refreshToken")
            return "refreshToken"
        return null;
    },
    checkAvailability : function(text){
        if (!text || typeof(text) == "undefined" || text.length == 0)
            return null;
        return text;
    }
}