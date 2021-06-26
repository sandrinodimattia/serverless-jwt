# gatsby-auth0-netlify-functions

This example shows how to use [@serverless-jwt](https://github.com/sandrinodimattia/serverless-jwt) with Gatsby and Netlify Functions.

A fully working example is available here: https://gatsby-auth0-netlify-functions.netlify.app/

## How does example this work?

### Gatsby

The Gatsby application uses [@auth0/auth0-react](https://github.com/auth0/auth0-react) to authenticate the user. Once the user is authenticated, the Gatsby application will receive an `id_token` and `access_token` from Auth0;

The `access_token` is then provided to our Netlify Function to authenticate the request.

### Netlify Functions

In the Netlify Function, we use [@serverless-jwt/netlify](https://github.com/sandrinodimattia/serverless-jwt/packages/netlify) to secure our functions.

The `NetlifyJwtVerifier` serves as a wrapper to the handler and perform an action based on whether the token is valid for not.

- If the token is _not_ valid, the handler will return an error to the client. 
- If it _is_ valid, it will execute your handler and expose all of the claims to the current function. So you'll have the guarantee that the request is authenticated.

See the handler set up below.

```js
const { NetlifyJwtVerifier } = require('@serverless-jwt/netlify');

const requireAuth = NetlifyJwtVerifier({
  issuer: process.env.JWT_ISSUER,
  audience: process.env.JWT_AUDIENCE
});

exports.handler = requireAuth(async (event, context) => {
  try {
    const { claims } = context.identityContext;

    return {
      statusCode: 200,
      body: JSON.stringify({ claims })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error_description: err.message })
    };
  }
});
```

## Testing

How to test the application locally:

1. Create an application in Auth0 of type "Single Page Application".
2. Configure the following fields to have a value of `http://localhost:8888`:
    - Allowed Callback URL
    - Allowed Logout URL
    - Allowed Web Origins
    - Allowed CORS
3. Create an API in Auth0 (e.g. with identifier `urn:tv-shows`) and create a permission for that API (e.g. `read:shows`).
4. Rename the `.env-template` file to `.env` and update all of the settings there.
5. Run the Gatsby application and the Netlify functions.
    ```sh
    npm run start:dev
    ```
