const jwt = require('jsonwebtoken');
const secretKey = '1234589'; // Secret key for JWT

const authenticateAdmin = (req, res, next) => {
    
    if (req.path === '/create-permanent-admin' && req.method === 'POST') {
        return next();
    }

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token == null) return res.sendStatus(401); // If no token is provided

    jwt.verify(token, secretKey, (err, user) => {
        if (err) return res.sendStatus(403); // Invalid token
        if (user.role !== 'admin') return res.sendStatus(403); // Check if the user is an admin
        req.user = user;
        next();
    });
};

module.exports = authenticateAdmin;
