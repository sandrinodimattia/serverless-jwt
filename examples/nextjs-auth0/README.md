# Next.js and Auth0 Example

This is an example of using `@auth0/auth0-react` with [Next.js](https://nextjs.org/).

Add the file `.env` with the `domain` and `clientId` of the application and `audience` (your API identifier)

```dotenv
JWT_ISSUER=https://your-tenant.auth0.com/
JWT_AUDIENCE=https://api/tv-shows
NEXT_PUBLIC_AUTH0_DOMAIN=your-tenant.auth0.com
NEXT_PUBLIC_AUTH0_CLIENT_ID=yourclientid
NEXT_PUBLIC_AUTH0_AUDIENCE=https://api/tv-shows
```

Run `npm run dev` to start the application at http://localhost:3000
