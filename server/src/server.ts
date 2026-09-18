import { app } from './app.js';
import { initDatabase } from './db/index.js';

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  await initDatabase();

  app.listen(PORT, () => {
    console.log(`🌾 AgriDirect API Server listening on port ${PORT}`);
    console.log(`🌐 Base API: http://localhost:${PORT}/api/v1`);
    console.log(`🩺 Health Check: http://localhost:${PORT}/api/health`);
  });
}

bootstrap().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
