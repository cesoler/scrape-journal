import { AiArticleSuggestionDTO } from "../models/JournalModel";

export function parseDate(rawDate: string | null): string {
    if (!rawDate) {
        return new Date().toISOString().split('T')[0];
    }

    const regex = /(\d{2})\/(\d{2})\/(\d{4})/;

    const match = rawDate.match(regex);

    if(!match) {
        return new Date().toISOString().split('T')[0];
    }

    const day = match[1];
    const month = match[2];
    const year = match[3];
    return `${year}-${month}-${day}`; 
}

export function parseJsonToAiArticleSuggestionDTO(jsonString: any): AiArticleSuggestionDTO {
    return {
        content: {
            url: jsonString.content.url,
            image: {
                url: jsonString.content.image?.url
            },
            section: jsonString.content.section,
            video: jsonString.content.video,
            recommendationTitle: jsonString.content.recommendationTitle,
            category: jsonString.content.category,
            recommendationSummary: jsonString.content.recommendationSummary,
            title: jsonString.content.title,
            summary: jsonString.content.summary
            },
        publication: jsonString.publication,
        created: jsonString.created,
        tenantId: jsonString.tenantId,
        type: jsonString.type
    };
}