// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\migrations\20250104000006-create-tenant-regions.js

module.exports = {
    async up(db, client) {
      await db.createCollection('tenantregions');
      await db.collection('tenantregions').createIndex({ tenantId: 1, regionId: 1 }, { unique: true });
      await db.collection('tenantregions').createIndex({ tenantId: 1 });
      await db.collection('tenantregions').createIndex({ regionId: 1 });
      await db.collection('tenantregions').createIndex({ status: 1 });
    },
  
    async down(db, client) {
      await db.collection('tenantregions').drop();
    }
  };
  