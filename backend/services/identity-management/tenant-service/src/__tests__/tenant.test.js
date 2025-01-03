// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\__tests__\tenant.test.js

const request = require('supertest');
const httpStatus = require('http-status');
const app = require('../app');
const setupTestDB = require('../utils/setupTestDB');
const { Tenant, TenantSettings, TenantBilling } = require('../models');
const { userOne, admin, insertUsers } = require('./fixtures/user.fixture');
const { tenantOne, tenantTwo, insertTenants } = require('./fixtures/tenant.fixture');
const { userOneAccessToken, adminAccessToken } = require('./fixtures/token.fixture');

setupTestDB();

describe('Tenant routes', () => {
  describe('POST /v1/tenants', () => {
    let newTenant;

    beforeEach(() => {
      newTenant = {
        name: 'Test Tenant',
        slug: 'test-tenant',
        description: 'Test tenant description',
        industry: 'Technology',
        size: 'SMALL',
        plan: 'FREE'
      };
    });

    test('should return 201 and successfully create tenant if data is ok', async () => {
      await insertUsers([admin]);

      const res = await request(app)
        .post('/v1/tenants')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newTenant)
        .expect(httpStatus.CREATED);

      expect(res.body).toEqual({
        id: expect.anything(),
        name: newTenant.name,
        slug: newTenant.slug,
        description: newTenant.description,
        industry: newTenant.industry,
        size: newTenant.size,
        status: 'ACTIVE',
        features: expect.any(Array),
        createdAt: expect.anything(),
        updatedAt: expect.anything()
      });

      const dbTenant = await Tenant.findById(res.body.id);
      expect(dbTenant).toBeDefined();
      expect(dbTenant).toMatchObject({
        name: newTenant.name,
        slug: newTenant.slug,
        description: newTenant.description,
        industry: newTenant.industry,
        size: newTenant.size,
        status: 'ACTIVE'
      });

      // Check if settings were created
      const settings = await TenantSettings.findOne({ tenantId: res.body.id });
      expect(settings).toBeDefined();

      // Check if billing was created
      const billing = await TenantBilling.findOne({ tenantId: res.body.id });
      expect(billing).toBeDefined();
      expect(billing.plan).toBe(newTenant.plan);
    });

    test('should return 401 error if access token is missing', async () => {
      await request(app)
        .post('/v1/tenants')
        .send(newTenant)
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 403 error if user is not admin', async () => {
      await insertUsers([userOne]);

      await request(app)
        .post('/v1/tenants')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(newTenant)
        .expect(httpStatus.FORBIDDEN);
    });

    test('should return 400 error if slug is invalid', async () => {
      await insertUsers([admin]);
      newTenant.slug = 'invalid slug';

      await request(app)
        .post('/v1/tenants')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newTenant)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 error if slug is already used', async () => {
      await insertUsers([admin]);
      await insertTenants([tenantOne]);
      newTenant.slug = tenantOne.slug;

      await request(app)
        .post('/v1/tenants')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newTenant)
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('GET /v1/tenants', () => {
    test('should return 200 and apply pagination', async () => {
      await insertUsers([admin]);
      await insertTenants([tenantOne, tenantTwo]);

      const res = await request(app)
        .get('/v1/tenants')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ page: 1, limit: 1 })
        .expect(httpStatus.OK);

      expect(res.body).toEqual({
        results: expect.any(Array),
        page: 1,
        limit: 1,
        totalPages: 2,
        totalResults: 2
      });
      expect(res.body.results).toHaveLength(1);
      expect(res.body.results[0].id).toBe(tenantOne.id);
    });

    test('should return 401 if access token is missing', async () => {
      await request(app)
        .get('/v1/tenants')
        .expect(httpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /v1/tenants/:tenantId', () => {
    test('should return 200 and the tenant object if data is ok', async () => {
      await insertUsers([admin]);
      await insertTenants([tenantOne]);

      const res = await request(app)
        .get(`/v1/tenants/${tenantOne.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.OK);

      expect(res.body).toEqual({
        id: tenantOne.id,
        name: tenantOne.name,
        slug: tenantOne.slug,
        description: tenantOne.description,
        industry: tenantOne.industry,
        size: tenantOne.size,
        status: tenantOne.status,
        features: expect.any(Array),
        createdAt: expect.anything(),
        updatedAt: expect.anything()
      });
    });

    test('should return 401 error if access token is missing', async () => {
      await request(app)
        .get(`/v1/tenants/${tenantOne.id}`)
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 404 error if tenant is not found', async () => {
      await insertUsers([admin]);

      await request(app)
        .get(`/v1/tenants/${tenantOne.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.NOT_FOUND);
    });
  });

  describe('DELETE /v1/tenants/:tenantId', () => {
    test('should return 204 if data is ok', async () => {
      await insertUsers([admin]);
      await insertTenants([tenantOne]);

      await request(app)
        .delete(`/v1/tenants/${tenantOne.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.NO_CONTENT);

      const dbTenant = await Tenant.findById(tenantOne.id);
      expect(dbTenant).toBeNull();
    });

    test('should return 401 error if access token is missing', async () => {
      await request(app)
        .delete(`/v1/tenants/${tenantOne.id}`)
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 403 error if user is not admin', async () => {
      await insertUsers([userOne]);
      await insertTenants([tenantOne]);

      await request(app)
        .delete(`/v1/tenants/${tenantOne.id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.FORBIDDEN);
    });

    test('should return 404 error if tenant is not found', async () => {
      await insertUsers([admin]);

      await request(app)
        .delete(`/v1/tenants/${tenantOne.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.NOT_FOUND);
    });
  });

  describe('PATCH /v1/tenants/:tenantId', () => {
    test('should return 200 and successfully update tenant if data is ok', async () => {
      await insertUsers([admin]);
      await insertTenants([tenantOne]);
      const updateBody = {
        name: 'Updated Name',
        description: 'Updated description'
      };

      const res = await request(app)
        .patch(`/v1/tenants/${tenantOne.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.OK);

      expect(res.body).toEqual({
        id: tenantOne.id,
        name: updateBody.name,
        description: updateBody.description,
        slug: tenantOne.slug,
        industry: tenantOne.industry,
        size: tenantOne.size,
        status: tenantOne.status,
        features: expect.any(Array),
        createdAt: expect.anything(),
        updatedAt: expect.anything()
      });
    });

    test('should return 404 if admin is updating another tenant that is not found', async () => {
      await insertUsers([admin]);
      const updateBody = { name: 'Updated Name' };

      await request(app)
        .patch(`/v1/tenants/${tenantOne.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.NOT_FOUND);
    });
  });
});
