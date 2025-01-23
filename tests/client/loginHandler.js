Tinytest.addAsync(
  'login-links - loginWithToken works',
  async function (test, done) {
    await createUserAndToken(function(targetId, token) {
      test.isNull(Meteor.userId())

      LoginLinks.loginWithToken(token, function (e) {
        // console.log('EEE', e)
        test.isUndefined(e)
        test.equal(Meteor.userId(), targetId)

        // created a resume token
        test.equal(typeof localStorage.getItem('Meteor.loginToken'), 'string')

        // also test server side of the connection
        Meteor.call('whoami', function(e, serverUserId) {
          test.equal(serverUserId, targetId)

          // resume should happen after reconnect
          Meteor.disconnect()

          existingHook = Meteor.connection.onReconnect
          Meteor.connection.onReconnect = function() {
            existingHook()

            test.equal(Meteor.userId(), targetId)

            Meteor.call('whoami', function(e, serverUserId) {
              test.equal(serverUserId, targetId)

              done()
            })
          }

          Meteor.reconnect()
        })
      })
    })
  }
)

Tinytest.addAsync(
  'login-links - per-token expiration works',
  async (test, done) => {
    await createUserAndExpiringToken(function(targetId, token) {
      test.isNull(Meteor.userId())
      setTimeout(() => {
        LoginLinks.loginWithToken(token, function (e) {
          test.equal(e.error, "login-links/token-expired")
          test.isNull(Meteor.userId())
          done()
        })
      }, 2000)
    })
  }
)
