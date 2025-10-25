import { Request, Response } from 'express';
import { journalService } from '../../core/services/journalService/JournalismService';
import { IJournalService } from '../../core/services/journalService/IJournalService';
import { ArticleDTO, AvailableColumnCategory } from '../../core/models/JournalModel';

class JournalismController {
  constructor(private service: IJournalService) { }

    public async scrapeJournal(req: Request, res: Response, column: AvailableColumnCategory): Promise<Response> {
      try {
        const articles: ArticleDTO[] = await this.service.scrapeJournalColumn(column);
        return res.status(200).json(articles);
      } catch (error) {
        return res.status(500).json({ error: 'Erro interno do servidor: ' + error  });
      }
    }
}

export const journalController = new JournalismController(journalService);