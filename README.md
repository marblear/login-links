Meteor package for sending links that automatically log in the user.

Add this package to your Meteor app with: `meteor add loren:login-links`

The main use case is sending an email or sms to your user with a link to your app that contains an OTP (one-time password)* that automatically logs them in (so they don't have to enter their username/password or do OAuth):

```
Josh Owens just commented on your blog post:
https://my-blog-app.com/post/abc?comment=3?token=A10F51nigkFsShxmvkLnlQ76Kzjh7h9pMuNxpVpO81a
```

\* *Note that despite the name, in this package, OTPs can be used multiple times, up until their expiry.*

## Contents

- [Basic usage](#basic-usage)
  - [On server](#on-server)
  - [Then on client](#then-on-client)
- [Security note](#security-note)
- [API](#api)
  - [Expiration](#expiration)
    - [Global](#global)
    - [Types](#types)
    - [Per token](#per-token)
  - [generateAccessToken](#generateaccesstoken)
  - [Logging in](#logging-in)
    - [loginWithToken](#loginwithtoken)
    - [connectionLogin](#connectionlogin)
  - [Hooks](#hooks)
    - [onTokenLogin](#ontokenlogin)
    - [onConnectionLogin](#ontokenlogin)
    - [connectionLoginReconnect](#connectionloginreconnect)
- [Related packages](#related-packages)
- [Package dev](#package-dev)
  - [Testing](#testing)
- [Credits](#credits)


## Basic usage

1. Generate an access token.
2. Put it in a secure HTTPS URL and send it to the user via email, sms, etc.
3. When the user clicks the link, get the token from the URL and use it to log the user in.

### On server

```javascript
const token = LoginLinks.generateAccessToken(user);

Email.send({
  text: 'Click this: https://myapp.com/autologin/' + token,
  ...
});
```

You could also use the token for all of your emails to users, adding it as a query parameter that can be added to any route:

`text: 'Josh Owens just commented on your post: https://myapp.com/anyroute?foo=bar&token=' + token`

### Then on client

```javascript
if (!Meteor.userId()) {
  token = // get token from URL (depends on your router and link format)

  LoginLinks.loginWithToken(token, (e, r) => {
    if (e) {
      // notify
      return;
    }

    // logged in!
  });
}   
```

## Security note

Normally the ability to gain access to a user account depends on knowledge of the username/email and password (of your app or the oauth service). In the case of `accounts-password`, you can also gain access to a user account if you can access the user's email, because you can call `sendResetPasswordEmail` and [`resetPassword`](http://docs.meteor.com/#/full/accounts_resetpassword), which logs you in. While currently such emails [do not expire](https://github.com/meteor/meteor/issues/6462), it's best practice that they do (in order to reduce the risk that someone will gain access to your email later, and find the reset email and use it). Similarly, you should pick an expiration period for `login-links`, according to the balance you choose between UX and security.

## API

### Expiration

When a login is attempted with a token that is expired, a `'login-links/token-expired'` error will be thrown. The default token expiration is one day.

You can configure expiration in three ways. A value of `0` is not supported.

#### Global

```javascript
LoginLinks.setDefaultExpirationInSeconds(60 * 60); // one hour
```

Call on both server and client. The default value is one day.

#### Types

```javascript
LoginLinks.setTypes({
  short: {expirationInSeconds: 10 * 60}, // ten minutes
  long: {expirationInSeconds: 30 * 24 * 60 * 60} // one month
});

LoginLinks.generateAccessToken(user, {type: 'short'});  
```

Call on both server and client

#### Per token

```javascript
// on server
LoginLinks.generateAccessToken(user, {expirationInSeconds: 10 * 60}); // ten minutes
```

### generateAccessToken

`LoginLinks.generateAccessToken(user, opts)` (server)

- `user`: `userId` or user object.
- `opts`: `{type: String}` or `{expirationInSeconds: Integer}`

*Note: If you pass a user object, it has to be a raw object, so if you're using `dburles:collection-helpers` on `Meteor.users`, you have to fetch it with `transform: null`: `Meteor.users.findOne({}, {transform: null})`*

Any additional fields in `opts` will be copied to the stored token that is provided to any [hooks](#hooks).

The token is 43 alphanumeric characters, and only the hashed version is stored in the DB.

### Logging in

There are two supported types of logging in. When you initiate a login, `Accounts.loggingIn()` is updated.

#### loginWithToken

`LoginLinks.loginWithToken(token, cb)` (client)

- `cb` is provided `error`

This is a full login: if it is called before expiration, the login will go through, and a resume token (different from an login-links access token) will be generated for the client. That means the client will continue to be logged in until your app's Accounts `loginExpirationInDays` (see http://docs.meteor.com/#/full/accounts_config).

#### connectionLogin

`LoginLinks.connectionLogin(token, cb)` (client)

- `cb` is provided `error, data`. `data` has a `userId` field as well as any custom fields on the `token` stored in the database or fields returned from [onConnectionLogin](#onConnectionLogin)

This is a temporary, connection-based login:
- When the connection is broken (eg if you reload the page or call `Meteor.disconnect()`), the user is no longer logged in, unless it's within the expiration window (in which case `connectionLogin` will automatically be called again with the same token)
- No resume tokens are created.
- If `connectionLogin` is successful, it will automatically be called inside other browser tabs that are opened later, provided the token hasn't expired.

The reconnect code uses `Meteor.connection.onReconnect`, so if you redefine it, make sure to save and call the existing hook:

```javascript
existingHook = Meteor.connection.onReconnect
Meteor.connection.onReconnect = () => {
  existingHook()

  // then your code
};
```

### Hooks

#### onTokenLogin

`LoginLinks.onTokenLogin(function(token, user){});` (server)

When [loginWithToken](#loginwithtoken) is used to successfully login a user, this hook is called before completion.

#### onConnectionLogin

`LoginLinks.onConnectionLogin(function(token, user){});` (server)

When [connectionLogin](#connectionlogin) is used to successfully login a user, this hook is called before completion. If you return an object, the object's fields will be added to the `data` object that is passed to the client [connectionLogin](#connectionLogin) callback.

#### connectionLoginReconnect

`LoginLinks.connectionLoginReconnect = function(token){};` (client)

On a `connectionLogin` reconnect attempt, by default it will call `connectionLogin` again. If you'd like a different function to be used, assign it to `LoginLinks.connectionLoginReconnect`

## Related packages

- [loren:roles-restricted](https://github.com/lorensr/roles-restricted) - If you want to restrict the permissions that the automatically-logged-in browser has, use this package along with [alanning:roles](https://github.com/alanning/meteor-roles).
- [accounts-passwordless](https://github.com/acemtp/meteor-accounts-passwordless/)
  - full accounts system (creates new user accounts)
  - no timeout on tokens
  - tokens are 4 digits
  - only email-based
  - token generation is triggered client-side
  - no `connectionLogin` option
- [dispatch:accounts-sms](https://github.com/DispatchMe/meteor-accounts-sms) SMS-code-only full accounts system
- [pascoual:otp](https://github.com/pascoual/meteor-otp/) - This is for TOTP (Time-based OTP), like Google Authenticator, usually used as 2FA (two-factor auth).
- [dburles:two-factor](http://meteorcapture.com/two-factor-authentication/) - Generates 2FA codes
- [dispatch:login-token](https://github.com/DispatchMe/meteor-login-token) Basically this package without `connectionLogin`. Would have just added to it had I found it earlier 😜

## Package dev

ES6 without semicolons

### Testing

```bash
git clone git@github.com:lorensr/login-links.git
cd login-links
meteor --release 1.3.3.1 test-packages ./
open localhost:3000
```

## Credits

Thanks to Share911 for sponsoring 👏
[share911.com](https://share911.com/) – the best emergency response system for your organization.

[Contributors](https://github.com/lorensr/roles-restricted/graphs/contributors)
