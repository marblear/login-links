class AccessToken {

  constructor(token) {
    if (!token.hashedToken || !token.when)
      throw new Meteor.Error('login-links error: access token is missing a field');

    _.extend(this, token);
  }

  get typeConfig() {
    let config;

    if (this.type)
      config = LoginLinks._accessTokenTypes[this.type];

    return config || {};
  }

  getExpirationInSeconds() {
    // console.log('getExpirationInSeconds', this.expirationInSeconds, this.type, LoginLinks._accessTokenTypes, this.typeConfig)
    return this.expirationInSeconds ||
      this.typeConfig.expirationInSeconds ||
      LoginLinks._defaultExpirationInSeconds;
  }

  get expiresAt() {
    let expirationInMilliseconds = this.getExpirationInSeconds() * 1000;
    return this.when.getTime() + expirationInMilliseconds;
  }

  get isExpired() {
    return this.expiresAt < Date.now();
  }

  get expirationReason() {
    return 'This access token (type \''
      + this.type
      + '\') has a '
      + this.getExpirationInSeconds()
      + '-second expiry, and expired at '
      + new Date(this.expiresAt);
  }

}

LoginLinks.AccessToken = AccessToken;
