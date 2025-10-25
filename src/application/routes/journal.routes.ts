import { Router, Request, Response } from 'express';
import { JournalRoutes } from '../constants/JournalRoutes';
import { journalService } from '../../core/services/JournalismService';
import { ArticleDTO } from '../../core/models/JournalModel';
import { journalController } from '../controllers/JournalismController';

const journalRoutes = Router();

journalRoutes.get(JournalRoutes.SCRAPE_JORNALISM, (req: Request, res: Response) => journalController.getAll(req, res, 'jornalismo'));


export { journalRoutes };