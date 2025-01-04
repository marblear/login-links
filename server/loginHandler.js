Accounts.registerLoginHandler(async function(loginRequest) {
  let token = loginRequest['login-links/accessToken'];

  if (!token)
    return undefined; // don't handle

  let { user, savedToken } = await LoginLinks._lookupToken(token);

  for (let hook of LoginLinks._tokenLoginHooks)
    await hook(savedToken, user);

  return { userId: user._id };
});
