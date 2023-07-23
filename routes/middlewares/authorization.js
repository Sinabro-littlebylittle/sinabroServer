const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyToken = (req, res, next) => {
  try {
    const clientToken = req.headers.cookie.replace('user=', '');
    const decoded = jwt.verify(clientToken, process.env.JWT_TOKEN_SECRET);
    if (!decoded) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    res.locals.sub = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token expried' });
  }
};

exports.verifyToken = verifyToken;
