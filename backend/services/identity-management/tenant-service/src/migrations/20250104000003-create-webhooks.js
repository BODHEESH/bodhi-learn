// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\migrations\20250104000003-create-webhooks.js

module.exports = {
    async up(db, client) {
      await db.createCollection('webhooks');
      await db.collection('webhooks').createIndex({ tenantId: 1 });
      await db.collection('webhooks').createIndex({ 'status': 1 });
      await db.collection('webhooks').createIndex({ tenantId: 1, status: 1 });
      await db.collection('webhooks').createIndex({ createdAt: 1 });
    },
  
    async down(db, client) {
      await db.collection('webhooks').drop();
    }
  };
  