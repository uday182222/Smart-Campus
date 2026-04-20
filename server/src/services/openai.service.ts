import OpenAI from 'openai';
import { logger } from '../utils/logger';
import { getCache, setCache } from '../config/redis';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export enum ServiceType {
  PALM = 'PALM',
  ASTROLOGY = 'ASTROLOGY',
  VASTU = 'VASTU',
  NUMEROLOGY = 'NUMEROLOGY',
  TAROT = 'TAROT',
}

// Summary generation prompt templates
const SUMMARY_TEMPLATES: Record<ServiceType, string> = {
  [ServiceType.PALM]: `Summarize this palm reading result in 2-3 concise sentences, focusing on the most significant findings about life line, heart line, and destiny. Be specific and insightful.`,
  
  [ServiceType.ASTROLOGY]: `Summarize this astrology reading in 2-3 concise sentences, highlighting the most important planetary positions, houses, and their key influences on the person's life. Be specific about astrological details.`,
  
  [ServiceType.VASTU]: `Summarize this Vastu analysis in 2-3 concise sentences, focusing on the most critical findings about space energy, directional alignments, and main recommendations for improvement.`,
  
  [ServiceType.NUMEROLOGY]: `Summarize this numerology reading in 2-3 concise sentences, emphasizing the key numbers (life path, destiny, soul urge) and their most significant meanings for the person.`,
  
  [ServiceType.TAROT]: `Summarize this tarot reading in 2-3 concise sentences, focusing on the major cards drawn, their positions, and the key message or guidance provided.`,
};

export class OpenAIService {
  /**
   * Generate AI summary for service result
   */
  static async generateSummary(
    serviceType: ServiceType,
    resultData: any
  ): Promise<string> {
    try {
      // Check cache first
      const cacheKey = `summary:${serviceType}:${JSON.stringify(resultData).slice(0, 100)}`;
      const cached = await getCache(cacheKey);
      
      if (cached) {
        logger.info('Summary retrieved from cache');
        return cached;
      }

      const template = SUMMARY_TEMPLATES[serviceType];
      const resultJson = JSON.stringify(resultData, null, 2);

      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at creating concise, insightful summaries of spiritual and mystical readings. Your summaries are specific, meaningful, and capture the essence of the reading.',
          },
          {
            role: 'user',
            content: `${template}\n\nResult data:\n${resultJson}`,
          },
        ],
        max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || '150'),
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
      });

      const summary = response.choices[0]?.message?.content?.trim() || 'Summary generation failed';

      // Cache the summary for 24 hours
      const cacheTtl = parseInt(process.env.SUMMARY_CACHE_TTL || '86400');
      await setCache(cacheKey, summary, cacheTtl);

      logger.info('Summary generated successfully', { serviceType });
      return summary;
    } catch (error: any) {
      logger.error('Error generating summary:', error);
      
      // Fallback summary
      return `${serviceType} reading completed. View full details for insights.`;
    }
  }

  /**
   * Generate embeddings for semantic search
   */
  static async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Check cache
      const cacheKey = `embedding:${text.slice(0, 100)}`;
      const cached = await getCache(cacheKey);
      
      if (cached) {
        logger.info('Embedding retrieved from cache');
        return cached;
      }

      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });

      const embedding = response.data[0].embedding;

      // Cache embeddings for 7 days
      await setCache(cacheKey, embedding, 604800);

      logger.info('Embedding generated successfully');
      return embedding;
    } catch (error: any) {
      logger.error('Error generating embedding:', error);
      throw error;
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  static cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Build enhanced context with past readings for AI
   */
  static buildEnhancedContext(
    _userMessage: string,
    relevantResults: Array<{
      id: string;
      serviceType: ServiceType;
      summary: string;
      createdAt: Date;
    }>
  ): string {
    if (relevantResults.length === 0) {
      return '';
    }

    const formatDate = (date: Date) => {
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (days === 0) return 'today';
      if (days === 1) return 'yesterday';
      if (days < 7) return `${days} days ago`;
      if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
      return `${Math.floor(days / 30)} months ago`;
    };

    let context = '\n\n📚 AVAILABLE PAST READINGS:\n';
    context += 'You can reference these past readings naturally in your response. Use the result IDs when referring to specific readings.\n\n';

    relevantResults.forEach((result, index) => {
      context += `${index + 1}. ${result.serviceType} READING (${formatDate(result.createdAt)}) [ID: ${result.id}]\n`;
      context += `   ${result.summary}\n\n`;
    });

    context += '\nINSTRUCTIONS:\n';
    context += '- Reference these readings naturally when relevant to the user\'s question\n';
    context += '- Mention the reading type (e.g., "your palm reading" or "your birth chart")\n';
    context += '- If the user asks about a specific reading, use the detailed information\n';
    context += '- If multiple readings are relevant, connect insights between them\n';
    context += '- Always be specific about which reading you\'re referring to\n';

    return context;
  }

  /**
   * Detect which service type the user is asking about
   */
  static detectServiceTypeFromQuery(query: string): ServiceType | null {
    const lowercaseQuery = query.toLowerCase();

    const keywords: Record<ServiceType, string[]> = {
      [ServiceType.PALM]: ['palm', 'hand', 'lines', 'heart line', 'life line', 'fate line', 'palm reading'],
      [ServiceType.ASTROLOGY]: ['chart', 'kundli', 'horoscope', 'planets', 'houses', 'birth chart', 'astrology', 'zodiac', 'ascendant'],
      [ServiceType.VASTU]: ['vastu', 'home', 'house', 'direction', 'room', 'energy', 'space', 'feng shui'],
      [ServiceType.NUMEROLOGY]: ['numbers', 'numerology', 'life path', 'destiny number', 'lucky number', 'birth number'],
      [ServiceType.TAROT]: ['tarot', 'cards', 'spread', 'reading', 'past', 'present', 'future', 'card reading'],
    };

    for (const [serviceType, keywordList] of Object.entries(keywords)) {
      if (keywordList.some(keyword => lowercaseQuery.includes(keyword))) {
        return serviceType as ServiceType;
      }
    }

    return null;
  }

  /**
   * Detect time-based references in query
   */
  static detectTimeReference(query: string): 'latest' | 'oldest' | 'recent' | null {
    const lowercaseQuery = query.toLowerCase();

    if (lowercaseQuery.includes('last') || lowercaseQuery.includes('recent') || lowercaseQuery.includes('latest')) {
      return 'latest';
    }

    if (lowercaseQuery.includes('first') || lowercaseQuery.includes('oldest') || lowercaseQuery.includes('earliest')) {
      return 'oldest';
    }

    if (lowercaseQuery.includes('yesterday') || lowercaseQuery.includes('today')) {
      return 'recent';
    }

    return null;
  }
}

export default OpenAIService;

