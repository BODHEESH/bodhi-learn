// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\migrations\20250104000005-create-audit-logs.js

module.exports = {
    async up(db, client) {
      await db.createCollection('auditlogs');
      await db.collection('auditlogs').createIndex({ tenantId: 1 });
      await db.collection('auditlogs').createIndex({ userId: 1 });
      await db.collection('auditlogs').createIndex({ action: 1 });
      await db.collection('auditlogs').createIndex({ resource: 1 });
      await db.collection('auditlogs').createIndex({ createdAt: 1 });
      await db.collection('auditlogs').createIndex({ tenantId: 1, createdAt: -1 });
      await db.collection('auditlogs').createIndex({ tenantId: 1, action: 1, createdAt: -1 });
    },
  
    async down(db, client) {
      await db.collection('auditlogs').drop();
    }
  };
  