import { Router } from 'express';
import { journalRoutes } from './journal.routes';
import { DEFAULT_ROUTES } from '../constants/DefaultRotes';

const defaultRouter = Router();

defaultRouter.use(DEFAULT_ROUTES.JOURNAL, journalRoutes);

export { defaultRouter };