import { Request, Response } from 'express';
import { journalService } from '../../core/services/JournalismService';
import { IJournalService } from '../../core/services/IJournalService';
import { ArticleDTO, AvailableJournalTypes } from '../../core/models/JournalModel';

class JournalismController {
  constructor(private service: IJournalService) { }

    public async getAll(req: Request, res: Response, type: AvailableJournalTypes): Promise<Response> {
    try {
      const articles: ArticleDTO[] = await this.service.scrapeJournals(type);
      return res.status(200).json(articles);
    } catch (error) {
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
       
}

export const journalController = new JournalismController(journalService);