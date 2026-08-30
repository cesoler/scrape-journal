// Must come first: DataSource is built at import time and reads DATABASE_URL,
// so the .env file has to be loaded before that module is evaluated.
import 'dotenv/config';
import 'reflect-metadata';
import express, { Express } from 'express';
import { defaultRouter } from './routes/default.routes';
import { initializeDatabase } from '../infra/database/DataSource';

const app: Express = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', defaultRouter);

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[Server] Server is running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('[Server] Failed to connect to the database:', error);
    process.exit(1);
  });
