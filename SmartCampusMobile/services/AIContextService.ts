// @ts-nocheck
/**
 * AI Context Service
 * Handles semantic search, context building, and result detection
 */

import ServiceResultsAPI, { ServiceType, SearchResult } from './ServiceResultsAPI';

export interface EnhancedContext {
  systemPrompt: string;
  relevantResults: SearchResult[];
  detectedServiceType: ServiceType | null;
  detectedTimeRef: 'latest' | 'oldest' | 'recent' | null;
}

class AIContextService {
  /**
   * Build enhanced AI context for a user message
   */
  async buildEnhancedContext(
    userMessage: string,
    conversationId?: string
  ): Promise<EnhancedContext> {
    try {
      // Get context from backend
      const contextData = await ServiceResultsAPI.buildContext(
        userMessage,
        conversationId
      );

      // Detect service type and time reference
      const detectedServiceType = this.detectServiceType(userMessage);
      const detectedTimeRef = this.detectTimeReference(userMessage);

      return {
        systemPrompt: contextData.context,
        relevantResults: contextData.relevantResults,
        detectedServiceType,
        detectedTimeRef,
      };
    } catch (error) {
      console.error('Error building enhanced context:', error);
      return {
        systemPrompt: '',
        relevantResults: [],
        detectedServiceType: null,
        detectedTimeRef: null,
      };
    }
  }

  /**
   * Search for relevant results
   */
  async findRelevantResults(
    query: string,
    limit: number = 3
  ): Promise<SearchResult[]> {
    try {
      return await ServiceResultsAPI.searchResults(query, limit);
    } catch (error) {
      console.error('Error finding relevant results:', error);
      return [];
    }
  }

  /**
   * Detect which service type the user is asking about
   */
  detectServiceType(query: string): ServiceType | null {
    const lowercaseQuery = query.toLowerCase();

    const keywords: Record<ServiceType, string[]> = {
      [ServiceType.PALM]: [
        'palm', 'hand', 'lines', 'heart line', 'life line', 
        'fate line', 'palm reading', 'palmistry'
      ],
      [ServiceType.ASTROLOGY]: [
        'chart', 'kundli', 'horoscope', 'planets', 'houses', 
        'birth chart', 'astrology', 'zodiac', 'ascendant', 'natal'
      ],
      [ServiceType.VASTU]: [
        'vastu', 'home', 'house', 'direction', 'room', 
        'energy', 'space', 'feng shui', 'building'
      ],
      [ServiceType.NUMEROLOGY]: [
        'numbers', 'numerology', 'life path', 'destiny number', 
        'lucky number', 'birth number', 'soul urge'
      ],
      [ServiceType.TAROT]: [
        'tarot', 'cards', 'spread', 'reading', 'past', 
        'present', 'future', 'card reading', 'deck'
      ],
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
  detectTimeReference(query: string): 'latest' | 'oldest' | 'recent' | null {
    const lowercaseQuery = query.toLowerCase();

    if (
      lowercaseQuery.includes('last') || 
      lowercaseQuery.includes('recent') || 
      lowercaseQuery.includes('latest')
    ) {
      return 'latest';
    }

    if (
      lowercaseQuery.includes('first') || 
      lowercaseQuery.includes('oldest') || 
      lowercaseQuery.includes('earliest')
    ) {
      return 'oldest';
    }

    if (
      lowercaseQuery.includes('yesterday') || 
      lowercaseQuery.includes('today')
    ) {
      return 'recent';
    }

    return null;
  }

  /**
   * Check if user is asking about past readings
   */
  isAskingAboutPastReadings(query: string): boolean {
    const lowercaseQuery = query.toLowerCase();
    
    const pastReadingPhrases = [
      'my reading',
      'my result',
      'past reading',
      'previous reading',
      'last reading',
      'my chart',
      'my palm',
      'what did',
      'what does my',
      'tell me about my',
      'remember my',
      'that reading',
    ];

    return pastReadingPhrases.some(phrase => lowercaseQuery.includes(phrase));
  }

  /**
   * Extract key phrases for result matching
   */
  extractKeyPhrases(query: string): string[] {
    const lowercaseQuery = query.toLowerCase();
    const phrases: string[] = [];

    // Extract possessive phrases (my palm reading, my birth chart, etc.)
    const possessiveRegex = /my\s+(\w+(?:\s+\w+)?)/g;
    let match;
    while ((match = possessiveRegex.exec(lowercaseQuery)) !== null) {
      phrases.push(match[1]);
    }

    // Extract "that" references
    const thatRegex = /that\s+(\w+(?:\s+\w+)?)/g;
    while ((match = thatRegex.exec(lowercaseQuery)) !== null) {
      phrases.push(match[1]);
    }

    return phrases;
  }

  /**
   * Build ambiguity resolution prompt
   */
  buildAmbiguityPrompt(results: SearchResult[]): string {
    if (results.length === 0) return '';
    if (results.length === 1) return '';

    let prompt = '\n\nI found multiple relevant readings:\n';
    results.forEach((result, index) => {
      const serviceName = ServiceResultsAPI.getServiceName(result.serviceType);
      const timeAgo = ServiceResultsAPI.formatTimeAgo(result.createdAt);
      prompt += `${index + 1}. ${serviceName} (${timeAgo})\n`;
    });
    prompt += '\nWhich one would you like to know about?';

    return prompt;
  }

  /**
   * Format results for display in context
   */
  formatResultsForContext(results: SearchResult[]): string {
    if (results.length === 0) return '';

    let formatted = '\n\n📚 Your Past Readings:\n';
    results.forEach((result, index) => {
      const serviceName = ServiceResultsAPI.getServiceName(result.serviceType);
      const timeAgo = ServiceResultsAPI.formatTimeAgo(result.createdAt);
      const icon = ServiceResultsAPI.getServiceIcon(result.serviceType);
      
      formatted += `\n${icon} ${serviceName} (${timeAgo})\n`;
      formatted += `${result.summary}\n`;
    });

    return formatted;
  }

  /**
   * Should we fetch context for this message?
   */
  shouldFetchContext(message: string): boolean {
    // Don't fetch for very short messages
    if (message.length < 10) return false;

    // Fetch if asking about past readings
    if (this.isAskingAboutPastReadings(message)) return true;

    // Fetch if service type detected
    if (this.detectServiceType(message)) return true;

    // Fetch if time reference detected
    if (this.detectTimeReference(message)) return true;

    // Don't fetch for greetings
    const greetings = ['hi', 'hello', 'hey', 'good morning', 'good evening'];
    if (greetings.some(greeting => message.toLowerCase().includes(greeting))) {
      return false;
    }

    return false;
  }

  /**
   * Create a reference indicator for AI message
   */
  createReferenceIndicator(result: SearchResult): string {
    const serviceName = ServiceResultsAPI.getServiceName(result.serviceType);
    const icon = ServiceResultsAPI.getServiceIcon(result.serviceType);
    return `${icon} ${serviceName}`;
  }
}

export default new AIContextService();

