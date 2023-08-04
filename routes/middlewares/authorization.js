const jwt = require('jsonwebtoken');
require('dotenv').config();
const verifyToken = (req, res, next) => {
  try {
    const userAgent = req.headers['user-agent'];
    let clientToken = '';

    switch (userAgent) {
      // [VSCode Extension]: REST Client 전용
      case 'vscode-restclient':
        clientToken = req.headers.cookie.replace('user=', '');
        break;
      // [그 외]: Android Application, Swagger-UI 전용
      default:
        const clientTokenWithBearer = req.headers.authorization;
        clientToken = clientTokenWithBearer.replace('Bearer ', ''); // Bearer 제거
        clientToken = clientToken.replace(/['"]+/g, ''); // 쌍따옴표 제거
        break;
    }

    const decoded = jwt.verify(clientToken, process.env.JWT_TOKEN_SECRET);
    if (!decoded) {
      return res.status(401).json({ error: 'Token expried' });
    }

    res.locals.sub = decoded.sub;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

exports.verifyToken = verifyToken;
