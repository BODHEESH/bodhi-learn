// \d\DREAM\bodhi-learn\backend\services\identity-management\user-service\src\api\validation\custom.validation.js

const config = require('../../config/app.config');

const password = (value, helpers) => {
  if (value.length < config.security.passwordMinLength) {
    return helpers.message(`Password must be at least ${config.security.passwordMinLength} characters`);
  }
  if (value.length > config.security.passwordMaxLength) {
    return helpers.message(`Password cannot exceed ${config.security.passwordMaxLength} characters`);
  }
  if (!config.security.passwordPattern.test(value)) {
    return helpers.message(
      'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
    );
  }
  return value;
};

const objectId = (value, helpers) => {
  if (!value.match(/^[0-9a-fA-F]{24}$/)) {
    return helpers.message('Invalid ID format');
  }
  return value;
};

const phone = (value, helpers) => {
  if (!value.match(/^\+?[1-9]\d{1,14}$/)) {
    return helpers.message('Invalid phone number format');
  }
  return value;
};

module.exports = {
  password,
  objectId,
  phone
};
