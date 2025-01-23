const when = new Date(Date.now() - 1000 * 60 * 60 * 24 * 365)

Tinytest.add(
  'login-links - setDefaultExpirationInSeconds',
  function (test) {
    let expiration = 10
    LoginLinks.setDefaultExpirationInSeconds(expiration)
    token = new LoginLinks.AccessToken({hashedToken: 'a', when })
    test.equal(token.getExpirationInSeconds(), expiration)
  }
)

Tinytest.add(
  'login-links - types work',
  function (test) {
    let month = 30 * 24 * 60 * 60
    LoginLinks.setTypes({
      short: {expirationInSeconds: 10 * 60},
      long: {expirationInSeconds: month}
    });
    token = new LoginLinks.AccessToken({hashedToken: 'a', when, type: 'long'})
    test.equal(token.getExpirationInSeconds(), month)
  }
)

Tinytest.add(
  'login-links - per-token expiration is retrieved correctly',
  function (test) {
    let month = 30 * 24 * 60 * 60
    token = new LoginLinks.AccessToken({hashedToken: 'a', when, expirationInSeconds: month})
    test.equal(token.getExpirationInSeconds(), month)
    test.isTrue(token.isExpired)
  }
)

// TODO this one is flaky, should succeed after hitting rerun button
Tinytest.addAsync(
  'login-links - old tokens are cleared',
  async function (test, done) {
    try {
      Accounts.createUser({email: 'a@b', password: 'a'})
    } catch(e) { }

    let user = await Meteor.users.findOneAsync()
    await LoginLinks.generateAccessToken(user._id, {expirationInSeconds: 0})
    Meteor.setTimeout(async function() {
      await LoginLinks._expireTokens()
      Meteor.setTimeout(async function(){
        console.log('user.services', user.services)
        console.log('user', user)
        console.log('Meteor.users.findOne(user._id)', await Meteor.users.findOneAsync(user._id))
        let beforeCount = user.services.accessTokens ? user.services.accessTokens.tokens.length : 0
        const afterUser = await Meteor.users.findOneAsync(user._id)
        let afterCount = afterUser.services.accessTokens.tokens.length
        test.equal(beforeCount, afterCount) // one added, one cleaned up
        done()
      }, 2000)

    }, 3000)
  }
)
