const userService = require('../../services/user.service');
const httpStatus = require('http-status');
const { ApiError } = require('../../utils/errors');
const logger = require('../../utils/logger');
const { pick } = require('../../utils/helpers');
const { catchAsync } = require('../../utils/async-handler');

class UserController {
  createUser = catchAsync(async (req, res) => {
    const user = await userService.create(req.body);
    logger.info('User created successfully', { userId: user.id });
    
    res.status(201).json({
      status: 'success',
      data: user
    });
  });

  getUser = catchAsync(async (req, res) => {
    const user = await userService.findById(req.params.id);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    res.json({
      status: 'success',
      data: user
    });
  });

  getUsers = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['email', 'name', 'role', 'status', 'institutionId']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    
    const result = await userService.advancedSearch(filter, options);
    res.json(result);
  });

  updateUser = catchAsync(async (req, res) => {
    const user = await userService.update(req.params.id, req.body);
    logger.info('User updated successfully', { userId: user.id });
    
    res.json({
      status: 'success',
      data: user
    });
  });

  deleteUser = catchAsync(async (req, res) => {
    await userService.delete(req.params.id);
    logger.info('User deleted successfully', { userId: req.params.id });
    
    res.status(204).send();
  });

  getUserProfile = catchAsync(async (req, res) => {
    const profile = await userService.getProfile(req.params.id);
    if (!profile) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Profile not found');
    }
    res.send(profile);
  });

  updateUserProfile = catchAsync(async (req, res) => {
    const profile = await userService.updateProfile(req.params.id, req.body);
    res.send(profile);
  });

  getUserPreferences = catchAsync(async (req, res) => {
    const preferences = await userService.getPreferences(req.params.id);
    res.send(preferences);
  });

  updateUserPreferences = catchAsync(async (req, res) => {
    const preferences = await userService.updatePreferences(req.params.id, req.body);
    res.send(preferences);
  });

  enableMfa = catchAsync(async (req, res) => {
    const { secret, qrCode } = await userService.setupMfa(req.params.id);
    res.send({ secret, qrCode });
  });

  verifyMfa = catchAsync(async (req, res) => {
    const result = await userService.verifyMfa(req.params.id, req.body.token);
    res.send({ verified: result });
  });

  disableMfa = catchAsync(async (req, res) => {
    await userService.disableMfa(req.params.id);
    res.status(httpStatus.NO_CONTENT).send();
  });

  generateBackupCodes = catchAsync(async (req, res) => {
    const codes = await userService.generateBackupCodes();
    res.send({ codes });
  });

  verifyBackupCode = catchAsync(async (req, res) => {
    const result = await userService.verifyBackupCode(req.params.id, req.body.code);
    res.send({ verified: result });
  });

  getUserSessions = catchAsync(async (req, res) => {
    const sessions = await userService.getUserSessions(req.params.id);
    res.send(sessions);
  });

  terminateSession = catchAsync(async (req, res) => {
    await userService.terminateSession(req.params.id, req.params.sessionId);
    res.status(httpStatus.NO_CONTENT).send();
  });

  terminateAllSessions = catchAsync(async (req, res) => {
    await userService.terminateAllSessions(req.params.id);
    res.status(httpStatus.NO_CONTENT).send();
  });

  lockAccount = catchAsync(async (req, res) => {
    await userService.lockAccount(req.params.id, req.body.reason);
    res.status(httpStatus.NO_CONTENT).send();
  });

  unlockAccount = catchAsync(async (req, res) => {
    await userService.unlockAccount(req.params.id);
    res.status(httpStatus.NO_CONTENT).send();
  });

  bulkCreateUsers = catchAsync(async (req, res) => {
    const users = await userService.bulkCreate(req.body);
    res.status(httpStatus.CREATED).send(users);
  });
}

module.exports = new UserController();