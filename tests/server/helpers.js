Meteor.methods({

  async cleardb() {
    await Meteor.users.removeAsync({})
  },

  whoami() {
    l('whoami: ', Meteor.userId())
    return Meteor.userId()
  },

  async generateToken(userId, opts) {
    // l('generateToken', {userId, opts})
    return await LoginLinks.generateAccessToken(userId, opts)
  }

})
