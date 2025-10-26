import { Router } from 'express';
import { journalRoutes } from './journal.routes';
import { DEFAULT_ROUTES } from '../constants/DefaultRotes';

const defaultRouter = Router();

defaultRouter.use(DEFAULT_ROUTES.JOURNAL, journalRoutes);
defaultRouter.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

export { defaultRouter };