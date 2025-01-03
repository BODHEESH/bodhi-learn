// \d\DREAM\bodhi-learn\backend\services\identity-management\user-service\src\config\database.config.js

const config = require('./app.config');

module.exports = {
  development: {
    ...config.databases.postgres,
    seederStorage: 'sequelize',
    seederStorageTableName: 'SequelizeData'
  },
  test: {
    ...config.databases.postgres,
    database: process.env.POSTGRES_TEST_DB || 'bodhi_users_test',
    logging: false
  },
  production: {
    ...config.databases.postgres,
    logging: false,
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000
    }
  }
};
