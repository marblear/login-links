Meteor.methods({
  'login-links/connectionLogin': async function(token) {
    let { user, savedToken } = await LoginLinks._lookupToken(token);
    l('connectionLogin user:', user._id);

    if (Meteor.userId() === user._id)
      throw new Meteor.Error('login-links/already-fully-logged-in');

    this.setUserId(user._id);

    let data = _.omit(savedToken, 'hashedToken');

    for (let hook of LoginLinks._connectionHooks) {
      value = await hook(savedToken, user);
      if (typeof value === 'object')
        _.extend(data, value);
    }

    data.userId = user._id;

    return data;
  }
});
