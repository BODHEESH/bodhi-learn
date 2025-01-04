// D:\DREAM\bodhi-learn\backend\services\identity-management\organization-service\src\api\v1\swagger\index.js

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Organization Service API',
      version: '1.0.0',
      description: 'API documentation for the Organization Service',
      contact: {
        name: 'API Support',
        email: 'support@bodhi.com'
      },
      license: {
        name: 'Apache 2.0',
        url: 'https://www.apache.org/licenses/LICENSE-2.0.html'
      }
    },
    servers: [
      {
        url: '/api/v1',
        description: 'Organization Service API v1'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{
      bearerAuth: []
    }],
    tags: [
      {
        name: 'Organizations',
        description: 'Organization management endpoints'
      },
      {
        name: 'Branches',
        description: 'Branch management endpoints'
      },
      {
        name: 'Departments',
        description: 'Department management endpoints'
      }
    ]
  },
  apis: [
    './src/api/v1/swagger/*.swagger.js'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
