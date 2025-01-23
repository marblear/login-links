window.Meteor = Meteor


let _createUserAndToken = async function(opts, cb) {
  localStorage.clear()
  await Meteor.callAsync('cleardb')
  Accounts.createUser({
    email: 'a@b',
    password: 'a'
  }, function(){
    let userId = Meteor.userId()
    Meteor.logout(async function() {
      await Meteor.callAsync('generateToken', userId, opts, function(e, token) {
        cb(userId, token)
      })
    })
  })
}

createUserAndToken = async function(cb) {
  await _createUserAndToken({}, cb)
}

createUserAndExpiringToken = async function(cb) {
  await _createUserAndToken({expirationInSeconds: 1}, cb)
}
