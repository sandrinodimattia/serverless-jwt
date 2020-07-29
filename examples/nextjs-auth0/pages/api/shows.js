import fetch from 'node-fetch';
import { requireScope } from '../../lib/auth';

const apiRoute = async (req, res) => {
  const fetchResponse = await fetch('https://api.tvmaze.com/shows');
  const shows = await fetchResponse.json();

  res.json({
    shows: shows.map((s) => ({
      id: s.id,
      url: s.url,
      name: s.name
    }))
  });
};

export default requireScope('read:shows', apiRoute);
