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
      try {
        const token = await Meteor.callAsync('generateToken', userId, opts);
        cb(userId, token)
      } catch (e) {
        console.log(e)
      }
    })
  })
}

createUserAndToken = async function(cb) {
  await _createUserAndToken({}, cb)
}

createUserAndExpiringToken = async function(cb) {
  await _createUserAndToken({expirationInSeconds: 1}, cb)
}
