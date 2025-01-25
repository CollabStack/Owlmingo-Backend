const bcrypt = require('bcrypt');
const { changePassword } = require('../../src/services/user/change_password.service');
const User = require('../../src/models/user.model');

jest.mock('bcrypt');
jest.mock('../../src/models/user.model');

describe('changePassword service', () => {
    const mockUser = {
        _id: 'testUserId',
        password: 'hashedOldPassword',
        save: jest.fn()
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully change password', async () => {
        User.findById.mockResolvedValue(mockUser);
        bcrypt.compare.mockResolvedValue(true);
        bcrypt.hash.mockResolvedValue('hashedNewPassword');

        const result = await changePassword('testUserId', 'oldPassword', 'newPassword');

        expect(User.findById).toHaveBeenCalledWith('testUserId');
        expect(bcrypt.compare).toHaveBeenCalledWith('oldPassword', 'hashedOldPassword');
        expect(bcrypt.hash).toHaveBeenCalledWith('newPassword', 10);
        expect(mockUser.save).toHaveBeenCalled();
        expect(result).toEqual({ message: 'Password changed successfully' });
    });

    it('should throw error if user not found!', async () => {
        User.findById.mockResolvedValue(null);

        await expect(changePassword('testUserId', 'oldPassword', 'newPassword'))
            .rejects
            .toThrow('User not found');
    });

    it('should throw error if old password is incorrect', async () => {
        User.findById.mockResolvedValue(mockUser);
        bcrypt.compare.mockResolvedValue(false);

        await expect(changePassword('testUserId', 'wrongPassword', 'newPassword'))
            .rejects
            .toThrow('Old password is incorrect');
    });
});
