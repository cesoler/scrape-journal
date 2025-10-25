import { Router } from 'express';
import { journalRoutes } from './journal.routes';

const defaultRouter = Router();

defaultRouter.use('/journalism', journalRoutes);

export { defaultRouter };