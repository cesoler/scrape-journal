import { Router, Request, Response } from 'express';
import { JournalRoutes } from '../constants/JournalRoutes';
import { journalController } from '../controllers/JournalController';

const journalRoutes = Router();

journalRoutes.get(JournalRoutes.SCRAPE, (req: Request, res: Response) => journalController.scrapeJournal(req, res));
journalRoutes.get(JournalRoutes.AI_SUGGESTIONS, (req: Request, res: Response) => journalController.getAISuggestions(req, res));

export { journalRoutes };