import { Request, Response } from 'express';
import { journalService } from '../../core/services/journalService/JournalService';
import { IJournalService } from '../../core/services/journalService/IJournalService';
import { CompleteArticleDTO, isAvailableColumnCategory, VALID_CATEGORIES } from '../../core/models/JournalModel';

class JournalismController {
  constructor(private service: IJournalService) { }

    public async scrapeJournal(req: Request, res: Response): Promise<Response> {
      const column = req.query.category as string;

      if (!isAvailableColumnCategory(column)) {
        return res.status(400).json({ 
          error: 'Query param "category" is missing or invalid.',
          validOptions: VALID_CATEGORIES
        });
      }
      try {
        const articles: CompleteArticleDTO[] = await this.service.scrapeJournalColumn(column);
        return res.status(200).json(articles);
      } catch (error) {
        return res.status(500).json({ error: 'An internal error occurred: ' + error });
      }
    }
}

export const journalController = new JournalismController(journalService);