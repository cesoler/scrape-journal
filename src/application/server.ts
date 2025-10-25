import express, { Express } from 'express';
import dotenv from 'dotenv';
import { defaultRouter } from './routes/default.routes';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', defaultRouter);

app.listen(PORT, () => {
  console.log(`[Server] Server is running at http://localhost:${PORT}`);
});