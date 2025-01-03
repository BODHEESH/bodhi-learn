// // \d\DREAM\bodhi-learn\backend\services\identity-management\user-service\src\api\controllers\user.controller.js

// const userService = require('../../services/user.service');
// const { ValidationError } = require('../../utils/errors');

// class UserController {
//   async create(req, res, next) {
//     try {
//       const user = await userService.create(req.body);
//       res.status(201).json({
//         status: 'success',
//         data: user
//       });
//     } catch (error) {
//       next(error);
//     }
//   }

//   async getById(req, res, next) {
//     try {
//       const user = await userService.findById(req.params.id);
//       res.json({
//         status: 'success',
//         data: user
//       });
//     } catch (error) {
//       next(error);
//     }
//   }

//   async list(req, res, next) {
//     try {
//       const { page, limit, institutionId, status, search, sortBy, sortOrder } = req.query;
      
//       let query = {};
//       if (institutionId) query.institutionId = institutionId;
//       if (status) query.status = status;

//       const options = {
//         page: parseInt(page),
//         limit: parseInt(limit),
//         order: sortBy ? [[sortBy, sortOrder || 'ASC']] : undefined
//       };

//       let result;
//       if (search) {
//         result = await userService.search(search, options);
//       } else {
//         result = await userService.findAll(query, options);
//       }

//       res.json({
//         status: 'success',
//         data: result.items,
//         pagination: {
//           total: result.total,
//           page: result.page,
//           totalPages: result.totalPages
//         }
//       });
//     } catch (error) {
//       next(error);
//     }
//   }

//   async update(req, res, next) {
//     try {
//       const user = await userService.update(req.params.id, req.body);
//       res.json({
//         status: 'success',
//         data: user
//       });
//     } catch (error) {
//       next(error);
//     }
//   }

//   async delete(req, res, next) {
//     try {
//       await userService.delete(req.params.id);
//       res.json({
//         status: 'success',
//         message: 'User deleted successfully'
//       });
//     } catch (error) {
//       next(error);
//     }
//   }

//   async updateStatus(req, res, next) {
//     try {
//       const { status } = req.body;
//       if (!status) {
//         throw new ValidationError('Status is required');
//       }

//       const user = await userService.updateStatus(req.params.id, status);
//       res.json({
//         status: 'success',
//         data: user
//       });
//     } catch (error) {
//       next(error);
//     }
//   }

//   async assignRole(req, res, next) {
//     try {
//       const { roles } = req.body;
//       if (!roles || !Array.isArray(roles) || roles.length === 0) {
//         throw new ValidationError('Roles array is required');
//       }

//       const user = await userService.assignRole(req.params.id, roles);
//       res.json({
//         status: 'success',
//         data: user
//       });
//     } catch (error) {
//       next(error);
//     }
//   }

//   async removeRole(req, res, next) {
//     try {
//       const { role } = req.body;
//       if (!role) {
//         throw new ValidationError('Role is required');
//       }

//       const user = await userService.removeRole(req.params.id, role);
//       res.json({
//         status: 'success',
//         data: user
//       });
//     } catch (error) {
//       next(error);
//     }
//   }

//   async listByInstitution(req, res, next) {
//     try {
//       const { institutionId } = req.params;
//       const { page, limit } = req.query;

//       const result = await userService.findByInstitution(institutionId, {
//         page: parseInt(page),
//         limit: parseInt(limit)
//       });

//       res.json({
//         status: 'success',
//         data: result.items,
//         pagination: {
//           total: result.total,
//           page: result.page,
//           totalPages: result.totalPages
//         }
//       });
//     } catch (error) {
//       next(error);
//     }
//   }
// }

// module.exports = new UserController();



// \d\DREAM\bodhi-learn\backend\services\identity-management\user-service\src\controllers\  user.controller.js  

const httpStatus = require('http-status');
const { userService } = require('../services');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const pick = require('../utils/pick');

const createUser = catchAsync(async (req, res) => {
  const user = await userService.create(req.body);
  res.status(httpStatus.CREATED).send(user);
});

const getUsers = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['email', 'name', 'role', 'status', 'institutionId', 'mfaEnabled', 'emailVerified']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await userService.advancedSearch(filter, options);
  res.send(result);
});

const getUser = catchAsync(async (req, res) => {
  const user = await userService.findById(req.params.id);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  res.send(user);
});

const updateUser = catchAsync(async (req, res) => {
  const user = await userService.update(req.params.id, req.body);
  res.send(user);
});

const deleteUser = catchAsync(async (req, res) => {
  await userService.delete(req.params.id);
  res.status(httpStatus.NO_CONTENT).send();
});

const getUserProfile = catchAsync(async (req, res) => {
  const profile = await userService.getProfile(req.params.id);
  if (!profile) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Profile not found');
  }
  res.send(profile);
});

const updateUserProfile = catchAsync(async (req, res) => {
  const profile = await userService.updateProfile(req.params.id, req.body);
  res.send(profile);
});

const getUserPreferences = catchAsync(async (req, res) => {
  const preferences = await userService.getPreferences(req.params.id);
  res.send(preferences);
});

const updateUserPreferences = catchAsync(async (req, res) => {
  const preferences = await userService.updatePreferences(req.params.id, req.body);
  res.send(preferences);
});

const enableMfa = catchAsync(async (req, res) => {
  const { secret, qrCode } = await userService.setupMfa(req.params.id);
  res.send({ secret, qrCode });
});

const verifyMfa = catchAsync(async (req, res) => {
  const result = await userService.verifyMfa(req.params.id, req.body.token);
  res.send({ verified: result });
});

const disableMfa = catchAsync(async (req, res) => {
  await userService.disableMfa(req.params.id);
  res.status(httpStatus.NO_CONTENT).send();
});

const generateBackupCodes = catchAsync(async (req, res) => {
  const codes = await userService.generateBackupCodes();
  res.send({ codes });
});

const verifyBackupCode = catchAsync(async (req, res) => {
  const result = await userService.verifyBackupCode(req.params.id, req.body.code);
  res.send({ verified: result });
});

const getUserSessions = catchAsync(async (req, res) => {
  const sessions = await userService.getUserSessions(req.params.id);
  res.send(sessions);
});

const terminateSession = catchAsync(async (req, res) => {
  await userService.terminateSession(req.params.id, req.params.sessionId);
  res.status(httpStatus.NO_CONTENT).send();
});

const terminateAllSessions = catchAsync(async (req, res) => {
  const sessionKey = `user:sessions:${req.params.id}`;
  await userService.redis.del(sessionKey);
  res.status(httpStatus.NO_CONTENT).send();
});

const lockAccount = catchAsync(async (req, res) => {
  await userService.lockAccount(req.params.id, req.body.reason);
  res.status(httpStatus.NO_CONTENT).send();
});

const unlockAccount = catchAsync(async (req, res) => {
  await userService.unlockAccount(req.params.id);
  res.status(httpStatus.NO_CONTENT).send();
});

const bulkCreateUsers = catchAsync(async (req, res) => {
  const users = await userService.bulkCreate(req.body);
  res.status(httpStatus.CREATED).send(users);
});

module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getUserProfile,
  updateUserProfile,
  getUserPreferences,
  updateUserPreferences,
  enableMfa,
  verifyMfa,
  disableMfa,
  generateBackupCodes,
  verifyBackupCode,
  getUserSessions,
  terminateSession,
  terminateAllSessions,
  lockAccount,
  unlockAccount,
  bulkCreateUsers
};

