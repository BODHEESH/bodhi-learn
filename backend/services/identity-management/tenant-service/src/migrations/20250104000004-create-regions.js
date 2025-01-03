// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\migrations\20250104000004-create-regions.js

module.exports = {
    async up(db, client) {
      await db.createCollection('regions');
      await db.collection('regions').createIndex({ code: 1 }, { unique: true });
      await db.collection('regions').createIndex({ status: 1 });
      await db.collection('regions').createIndex({ provider: 1 });
      await db.collection('regions').createIndex({ 'location.country': 1 });
    },
  
    async down(db, client) {
      await db.collection('regions').drop();
    }
  };
  