// \d\DREAM\bodhi-learn\backend\services\identity-management\user-service\src\models\index.js

const { Sequelize } = require('sequelize');
const mongoose = require('mongoose');
const config = require('../config/app.config');

// Import models
const User = require('./user.model');
const Profile = require('./profile.model');
const Role = require('./role.model');

// Initialize Sequelize
const sequelize = new Sequelize(config.databases.postgres);

// Initialize models
const models = {
  User: User.init(sequelize),
  Profile: Profile.init(sequelize),
  Role: Role.init(sequelize)
};

// Set up associations
Object.values(models)
  .filter(model => typeof model.associate === 'function')
  .forEach(model => model.associate(models));

// Connect to MongoDB
mongoose.connect(config.databases.mongodb.uri, config.databases.mongodb.options)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

module.exports = {
  sequelize,
  mongoose,
  ...models
};
