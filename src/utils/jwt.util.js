const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();
const generateToken = (payload) => {
    const { global_id, role } = payload; // Destructure the required fields from the payload
    const params = { global_id, role }; // Create a new object with only the required fields
    return jwt.sign(params, process.env.JWT_SECRET, { expiresIn: '5m'});
};

const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};

const refreshToken = (token) => {
    const decoded = jwt.decode(token);
    const { global_id, role } = decoded;
    return jwt.sign({global_id, role}, process.env.JWT_SECRET, { expiresIn: '10080m' });
};  

module.exports = { generateToken, verifyToken, refreshToken };