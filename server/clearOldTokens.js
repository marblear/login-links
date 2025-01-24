LoginLinks._expireTokens = async function() {
  const users = await Meteor.users.find({
    'services.accessTokens.tokens': {
      $exists: true,
      $ne: []
    }
  }).fetchAsync();
  for (const user of users) {
    for (let token of user.services.accessTokens.tokens) {
      const accessToken = new LoginLinks.AccessToken(token);
      if (accessToken.isExpired) {
        await Meteor.users.updateAsync(user._id, {
          $pull: {
            'services.accessTokens.tokens': {
              hashedToken: token.hashedToken
            }
          }
        });
      }
    }
  }
};

Meteor.setInterval(function() {
  void LoginLinks._expireTokens();
}, 60 * 60 * 1000); // 1 hour
