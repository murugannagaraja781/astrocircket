const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    let token = req.header('x-auth-token');
    if (!token && req.header('Authorization')) {
        const authHeader = req.header('Authorization');
        if (authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        } else {
            token = authHeader;
        }
    }

    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

    try {
        const jwtSecret = process.env.JWT_SECRET || 'astrocricket_secure_jwt_secret_2025';
        const decoded = jwt.verify(token, jwtSecret);
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};
