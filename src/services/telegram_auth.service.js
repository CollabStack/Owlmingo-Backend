const jwtUtil = require('../utils/jwt.util');
const User = require('../models/user.model');


const telegramOAuth = async (first_name, last_name, username, telegram_id) => {
    try {
        // Ensure all necessary parameters are provided
        if (!telegram_id || !first_name || !last_name) {
            throw new Error('Missing required data for Registration!!!');
        }

        // Check if the user already exists based on telegram_id
        const existingUser = await User.findOne({ telegram_id });

        // Construct the username
        const username_format = first_name && last_name ? `${first_name} ${last_name}` : username;

        // Create a new user if not existing, otherwise use the existing one
        let user;
        if (!existingUser && username_format && telegram_id) {
            user = await User.create({ 
                username: username_format, 
                telegram_id 
            });
        } else {
            user = existingUser;
        }

        // Generate a token for the user
        const token = jwtUtil.generateToken({ global_id: user.global_id, role: user.role });
        
        return { token, user };

    } catch (error) {
        console.error("Error during Telegram OAuth:", error);
        throw error;
    }
};


module.exports = {
    telegramOAuth
}


// const jwtUtil = require('../utils/jwt.util');
// const User = require('../models/user.model');

// const telegramOAuth = async (first_name, last_name, username, telegram_id) => {
//     try {
//         // Ensure all necessary parameters are provided
//         if (!telegram_id || !first_name || !last_name) {
//             throw new Error('Missing required data for Registration!!!');
//         }

//         // Check if the user already exists based on telegram_id
//         const existingUser = await User.findOne({ telegram_id });

//         // Construct the username
//         const username_format = first_name && last_name ? `${first_name} ${last_name}` : username;

//         // Create a new user if not existing, otherwise use the existing one
//         let user;
//         if (!existingUser && username_format && telegram_id) {
//             user = await User.create({ 
//                 username: username_format, 
//                 telegram_id 
//             });
//         } else {
//             user = existingUser;
//         }

//         // Generate a token for the user
//         const token = jwtUtil.generateToken({ global_id: user.global_id, role: user.role });
        
//         return { token, user };

//     } catch (error) {
//         console.error("Error during Telegram OAuth:", error);
//         throw error;
//     }
// };

// module.exports = {
//     telegramOAuth
// };
