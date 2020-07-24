const fetch = require('node-fetch');
const { requireScope } = require('../../lib/auth');

exports.handler = requireScope('read:shows', async (event, context) => {
  try {
    const res = await fetch('https://api.tvmaze.com/shows');
    const shows = await res.json();

    return {
      statusCode: 200,
      body: JSON.stringify(
        shows.map((s) => ({
          id: s.id,
          url: s.url,
          name: s.name
        }))
      )
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error_description: err.message })
    };
  }
});
