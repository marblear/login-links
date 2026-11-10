/* global Meteor, Accounts, LoginLinks, _, check, Match */
void Meteor.users.createIndexAsync(
  { 'services.accessTokens.tokens.hashedToken': 1 },
  { name: 'login-links:services.accessTokens' });


_.extend(LoginLinks, {

  /**
   * Generate a token to send and later use for loginWithToken or connectionLogin
   * @param {string|object} user
   * @param {object} opts - `{type: String}` or `{expirationInSeconds: Integer}`. Any additional fields in `opts` will be copied to the stored token that is provided to any hooks.
   */
  async generateAccessToken(user, opts) {
    const traceStarted = Date.now();
    const trace = phase => {
      if (!Meteor.settings.private?.debug?.traceAuth) return;
      console.info('[native-auth]', JSON.stringify({
        time: new Date().toISOString(), pid: process.pid,
        method: 'login-links:generateAccessToken', phase,
        elapsedMs: Date.now() - traceStarted
      }));
    };


    check(user, Match.OneOf(String, Object), '`user` must be a string or basic object');
    check(opts, Match.Optional(Object));

    if ('string' === typeof user) {
      user = { _id: user };
    } else if ('object' !== typeof user) {
      throw new Error('login-links error: invalid user argument');
    }

    trace('token-generate-start');
    const stampedToken = Accounts._generateStampedLoginToken();
    trace('token-generate-end');
    trace('token-hash-start');
    const hashStampedToken = Accounts._hashStampedToken(stampedToken);
    trace('token-hash-end');

    if (opts)
      _.extend(hashStampedToken, opts);

    trace('token-db-update-start');
    await Meteor.users.updateAsync(user._id, {
      $push: {
        'services.accessTokens.tokens': hashStampedToken
      }
    });

    trace('token-db-update-end');

    return stampedToken.token;
  }, // end generateAccessToken

  /**
   * @callback loginHook
   * @param {string} token
   * @param {object} user - only contains `_id` and `services.accessTokens.tokens`
   */

  _tokenLoginHooks: [],

  /**
   * When loginWithToken is used to successfully login a user, this hook is called before completion.
   * @param {loginHook} hook
   */
  onTokenLogin(hook) {
    this._tokenLoginHooks.push(hook);
  },

  _connectionHooks: [],

  /**
   * When connectionLogin is used to successfully login a user, this hook is called before completion. If you return an object, the object's fields will be added to the `data` object that is passed to the client connectionLogin callback.
   * @param {loginHook} hook
   */
  onConnectionLogin(hook) {
    this._connectionHooks.push(hook);
  },

  async _lookupToken(token) {
    check(token, String);

    const hashedToken = Accounts._hashLoginToken(token);

    // $elemMatch projection doens't work on nested fields
    const fields = {
      _id: 1,
      'services.accessTokens.tokens': 1
    };

    const user = await Meteor.users.findOneAsync({
      'services.accessTokens.tokens.hashedToken': hashedToken
    }, { fields });

    if (!user)
      throw new Meteor.Error('login-links/token-not-found');

    const savedToken = _.findWhere(user.services.accessTokens.tokens, { hashedToken });
    const accessToken = new LoginLinks.AccessToken(savedToken);

    if (accessToken.isExpired)
      throw new Meteor.Error('login-links/token-expired',
        accessToken.expirationReason);

    return { user, savedToken };
  } // end _lookupToken

}); // end _.extend(LoginLinks, ...)
