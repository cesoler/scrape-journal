import { Request, Response } from 'express';
import { journalService } from '../../core/services/journalService/JournalService';
import { IJournalService } from '../../core/services/journalService/IJournalService';
import { CompleteArticleDTO, isAvailableColumnCategory, VALID_CATEGORIES } from '../../core/models/JournalModel';

class JournalController {
  constructor(private service: IJournalService) { }

    public async scrapeJournal(req: Request, res: Response): Promise<Response<CompleteArticleDTO[]>> {
      const column = req.query.category as string;

      if (!isAvailableColumnCategory(column)) {
        return res.status(400).json({ 
          error: 'Query param "category" is missing or invalid.',
          validOptions: VALID_CATEGORIES
        });
      }
      try {
        const articles = await this.service.scrapeJournalColumn(column);
        return res.status(200).json(articles);
      } catch (error) {
        return res.status(500).json({ error: 'An internal error occurred: ' + error });
      }
    }

    public async getAISuggestions(req: Request, res: Response): Promise<Response<CompleteArticleDTO[]>> {
      const column = req.query.category as string;
      const itemsPerPage = parseInt(req.query.itemsPerPage as string) || 4;

      if (!isAvailableColumnCategory(column)) {
        return res.status(400).json({ 
          error: 'Query param "category" is missing or invalid.',
          validOptions: VALID_CATEGORIES
        });
      }

      try {
        const suggestions = await this.service.getAISuggestions(column, itemsPerPage);
        return res.status(200).json(suggestions);
      } catch (error) {
        return res.status(500).json({ error: 'An internal error occurred: ' + error });
      }
  }
}
export const journalController = new JournalController(journalService);