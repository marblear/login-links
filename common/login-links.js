LoginLinks = {

  _defaultExpirationInSeconds: 24 * 60 * 60, // 1 day

  setDefaultExpirationInSeconds(expiration) {
    this._defaultExpirationInSeconds = expiration;
  },

  _accessTokenTypes: {},

  setTypes(types) {
    this._accessTokenTypes = types;
  }

};


l = function() {
};

// uncomment while debugging:
// l = function(){
//   console.log(...arguments)
// }
