const jwt = require('jsonwebtoken');
// Hardcoded secret from .env inspection
const secret = 'supersecretkey123';

const payload = {
    user: {
        id: '64f8a5f8e0b5a1a2b3c4d5e6'
    }
};

const token = jwt.sign(payload, secret, { expiresIn: 3600 });
console.log(token);
