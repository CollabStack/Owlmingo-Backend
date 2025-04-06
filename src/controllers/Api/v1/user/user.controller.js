// const { successResponse, errorResponse } = require('../../baseAPI.controller');
// const authService = require('../../../../services/auth.service');
// const { refreshToken } = require('../../../../utils/jwt.util');

// getUserInfo = async (req, res) => {
//     try {
//         const { username, global_id } = req.body;
//         const user = await authService.register(username, email, password, role);
//         successResponse(res, {
//             username: user.username,
//             email: user.email,
//             isVerified: user.isVerified
//         }, 'Registration successful. Please check your email for OTP.');
//     } catch (error) {
//         errorResponse(res, error.message || 'Registration failed');
//     }
// };



// module.exports = {
//     getUserInfo
// };