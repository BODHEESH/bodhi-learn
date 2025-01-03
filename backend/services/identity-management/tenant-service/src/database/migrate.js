// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\database\migrate.js

const { Sequelize } = require('sequelize');
const { Umzug, SequelizeStorage } = require('umzug');
const config = require('../config');
const logger = require('../utils/logger');

// Initialize Sequelize with database configuration
const sequelize = new Sequelize(config.database.url, {
  logging: msg => logger.debug(msg)
});

// Initialize Umzug for migrations
const umzug = new Umzug({
  migrations: {
    glob: 'src/database/migrations/*.js',
    resolve: ({ name, path, context }) => {
      const migration = require(path);
      return {
        name,
        up: async () => migration.up(context, Sequelize),
        down: async () => migration.down(context, Sequelize)
      };
    }
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console
});

// Migration runner function
async function runMigrations() {
  try {
    logger.info('Starting database migrations...');
    
    // Run pending migrations
    const migrations = await umzug.up();
    
    if (migrations.length === 0) {
      logger.info('No pending migrations to run');
    } else {
      logger.info(`Executed ${migrations.length} migrations:`);
      migrations.forEach(migration => {
        logger.info(`- ${migration.name}`);
      });
    }

    // Run seeders if specified
    if (process.env.RUN_SEEDERS === 'true') {
      logger.info('Running database seeders...');
      
      const seeders = await umzug.up({
        migrations: {
          glob: 'src/database/seeders/*.js'
        }
      });

      if (seeders.length === 0) {
        logger.info('No seeders to run');
      } else {
        logger.info(`Executed ${seeders.length} seeders:`);
        seeders.forEach(seeder => {
          logger.info(`- ${seeder.name}`);
        });
      }
    }

    logger.info('Database migration completed successfully');
  } catch (error) {
    logger.error('Error running migrations:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'up':
    runMigrations()
      .then(() => process.exit(0))
      .catch(error => {
        console.error(error);
        process.exit(1);
      });
    break;

  case 'down':
    umzug.down()
      .then(() => {
        logger.info('Successfully reverted last migration');
        process.exit(0);
      })
      .catch(error => {
        logger.error('Error reverting migration:', error);
        process.exit(1);
      });
    break;

  case 'pending':
    umzug.pending()
      .then(migrations => {
        if (migrations.length === 0) {
          logger.info('No pending migrations');
        } else {
          logger.info('Pending migrations:');
          migrations.forEach(migration => {
            logger.info(`- ${migration.name}`);
          });
        }
        process.exit(0);
      })
      .catch(error => {
        logger.error('Error checking pending migrations:', error);
        process.exit(1);
      });
    break;

  default:
    logger.error('Invalid command. Use: up, down, or pending');
    process.exit(1);
}

module.exports = {
  runMigrations,
  umzug
};
