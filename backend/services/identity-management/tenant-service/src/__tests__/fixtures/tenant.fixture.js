// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\__tests__\fixtures\tenant.fixture.js

const mongoose = require('mongoose');
const { Tenant } = require('../../models');

const tenantOne = {
  _id: mongoose.Types.ObjectId(),
  name: 'Test Tenant One',
  slug: 'test-tenant-one',
  description: 'Test tenant one description',
  industry: 'Technology',
  size: 'SMALL',
  status: 'ACTIVE',
  features: ['feature1', 'feature2'],
  metadata: {
    key1: 'value1',
    key2: 'value2'
  }
};

const tenantTwo = {
  _id: mongoose.Types.ObjectId(),
  name: 'Test Tenant Two',
  slug: 'test-tenant-two',
  description: 'Test tenant two description',
  industry: 'Healthcare',
  size: 'MEDIUM',
  status: 'ACTIVE',
  features: ['feature1', 'feature3'],
  metadata: {
    key1: 'value3',
    key2: 'value4'
  }
};

const insertTenants = async (tenants) => {
  await Tenant.insertMany(tenants.map((tenant) => ({ ...tenant })));
};

module.exports = {
  tenantOne,
  tenantTwo,
  insertTenants,
};
