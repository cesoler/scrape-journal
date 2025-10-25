import { Router, Request, Response } from 'express';
import { JournalRoutes } from '../constants/JournalRoutes';
import { journalController } from '../controllers/JournalismController';

const journalRoutes = Router();

journalRoutes.get(JournalRoutes.SCRAPE_JOURNALISM, (req: Request, res: Response) => journalController.scrapeJournal(req, res, 'jornalismo'));

export { journalRoutes };