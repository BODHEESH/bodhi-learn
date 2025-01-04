// \d\DREAM\bodhi-learn\backend\services\identity-management\user-service\src\api\routes\index.js

const express = require('express');
const userRoutes = require('./user.routes');
const profileRoutes = require('./profile.routes');
const roleRoutes = require('./role.routes');

const router = express.Router();

router.use('/users', userRoutes);
router.use('/profiles', profileRoutes);
router.use('/roles', roleRoutes);

module.exports = router;
