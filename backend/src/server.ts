import { createApp } from './app';
import { config } from './config/env';
import { getDb } from './db';

async function bootstrap() {
  try {
    // Initialize DB connection and schema
    await getDb();

    const app = createApp();

    const server = app.listen(config.port, '0.0.0.0', () => {
      console.log('----------------------------------------------------');
      console.log(`🚀 MiniLedger Backend running on http://localhost:${config.port}`);
      console.log(`📁 Uploads available at: http://localhost:${config.port}/uploads`);
      console.log(`🛠️  Environment: ${config.nodeEnv}`);
      console.log('----------------------------------------------------');
    });

    // Graceful shutdown handling
    const shutdown = async () => {
      console.log('\nGracefully shutting down MiniLedger backend...');
      server.close(async () => {
        const db = await getDb();
        await db.close();
        console.log('Database connections closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('Fatal bootstrap error:', error);
    process.exit(1);
  }
}

bootstrap();
