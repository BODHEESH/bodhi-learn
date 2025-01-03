// \d\DREAM\bodhi-learn\backend\services\identity-management\user-service\src\__tests__\controllers\user.controller.test.js

const request = require('supertest');
const app = require('../../app');
const { User, Role } = require('../../database/models');
const { generateToken } = require('../../utils/jwt');
const { redis } = require('../../services/redis.service');

describe('User Controller', () => {
  let authToken;
  let testUser;
  let adminRole;

  beforeAll(async () => {
    // Create test role
    adminRole = await Role.create({
      name: 'super_admin',
      displayName: 'Super Admin',
      level: 0
    });

    // Create test user
    testUser = await User.create({
      email: 'test@example.com',
      passwordHash: 'hashedPassword',
      firstName: 'Test',
      lastName: 'User',
      status: 'active',
      institutionId: '550e8400-e29b-41d4-a716-446655440000'
    });

    // Generate auth token
    authToken = generateToken(testUser);
  });

  beforeEach(async () => {
    await redis.flushall();
  });

  describe('GET /api/users', () => {
    it('should return list of users', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should handle pagination', async () => {
      const response = await request(app)
        .get('/api/users?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('limit');
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user details', async () => {
      const response = await request(app)
        .get(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.id).toBe(testUser.id);
    });

    it('should return 404 for non-existent user', async () => {
      await request(app)
        .get('/api/users/550e8400-e29b-41d4-a716-446655440000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'new@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        institutionId: '550e8400-e29b-41d4-a716-446655440000'
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.email).toBe(userData.email);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user details', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name'
      };

      const response = await request(app)
        .put(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.firstName).toBe(updateData.firstName);
      expect(response.body.data.lastName).toBe(updateData.lastName);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete a user', async () => {
      const userToDelete = await User.create({
        email: 'delete@example.com',
        passwordHash: 'hashedPassword',
        firstName: 'Delete',
        lastName: 'User',
        status: 'active',
        institutionId: '550e8400-e29b-41d4-a716-446655440000'
      });

      await request(app)
        .delete(`/api/users/${userToDelete.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      const deletedUser = await User.findByPk(userToDelete.id);
      expect(deletedUser).toBeNull();
    });
  });
});
