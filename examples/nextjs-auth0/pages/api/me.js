import { requireAuth } from '../../lib/auth';

const apiRoute = async (req, res) => {
  const { claims } = req.identityContext;

  res.json({
    claims
  });
};

export default requireAuth(apiRoute);
