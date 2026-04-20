/**
 * Service Integration
 * Auto-save and auto-attachment logic for service results
 */

import ServiceResultsAPI, { ServiceType } from './ServiceResultsAPI';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ServiceCompletionData {
  serviceType: ServiceType;
  resultData: any;
  conversationId?: string;
}

class ServiceIntegration {
  private autoAttachEnabled = true;
  private autoAttachDelay = 3000; // 3 seconds

  /**
   * Initialize service integration
   */
  async initialize() {
    // Load user preferences
    const autoAttach = await AsyncStorage.getItem('autoAttachResults');
    this.autoAttachEnabled = autoAttach !== 'false';
  }

  /**
   * Set auto-attach preference
   */
  async setAutoAttach(enabled: boolean) {
    this.autoAttachEnabled = enabled;
    await AsyncStorage.setItem('autoAttachResults', enabled.toString());
  }

  /**
   * Get auto-attach preference
   */
  getAutoAttach(): boolean {
    return this.autoAttachEnabled;
  }

  /**
   * Handle service completion - save and optionally attach
   */
  async handleServiceCompletion(
    data: ServiceCompletionData,
    onSaved?: (resultId: string) => void,
    onAttached?: (resultId: string) => void
  ): Promise<string> {
    try {
      // Save the result
      const result = await ServiceResultsAPI.saveResult(data);
      
      // Notify saved
      if (onSaved) {
        onSaved(result.id);
      }

      // Auto-attach if enabled and we have a conversation
      if (this.autoAttachEnabled && data.conversationId) {
        await this.autoAttachWithDelay(
          result.id,
          data.conversationId,
          onAttached
        );
      }

      return result.id;
    } catch (error) {
      console.error('Error handling service completion:', error);
      throw error;
    }
  }

  /**
   * Auto-attach with delay
   */
  private async autoAttachWithDelay(
    resultId: string,
    conversationId: string,
    onAttached?: (resultId: string) => void
  ) {
    // Wait for configured delay
    await new Promise((resolve) => setTimeout(resolve, this.autoAttachDelay));

    // Create a message for the attachment (you'll need to integrate with your chat system)
    // For now, we'll just notify
    if (onAttached) {
      onAttached(resultId);
    }
  }

  /**
   * Palm Reading Service Handler
   */
  async handlePalmReading(
    analysisData: any,
    conversationId?: string,
    onSaved?: (resultId: string) => void,
    onAttached?: (resultId: string) => void
  ): Promise<string> {
    return this.handleServiceCompletion(
      {
        serviceType: ServiceType.PALM,
        resultData: analysisData,
        conversationId,
      },
      onSaved,
      onAttached
    );
  }

  /**
   * Astrology Service Handler
   */
  async handleAstrology(
    chartData: any,
    conversationId?: string,
    onSaved?: (resultId: string) => void,
    onAttached?: (resultId: string) => void
  ): Promise<string> {
    return this.handleServiceCompletion(
      {
        serviceType: ServiceType.ASTROLOGY,
        resultData: chartData,
        conversationId,
      },
      onSaved,
      onAttached
    );
  }

  /**
   * Vastu Service Handler
   */
  async handleVastu(
    analysisData: any,
    conversationId?: string,
    onSaved?: (resultId: string) => void,
    onAttached?: (resultId: string) => void
  ): Promise<string> {
    return this.handleServiceCompletion(
      {
        serviceType: ServiceType.VASTU,
        resultData: analysisData,
        conversationId,
      },
      onSaved,
      onAttached
    );
  }

  /**
   * Numerology Service Handler
   */
  async handleNumerology(
    calculationData: any,
    conversationId?: string,
    onSaved?: (resultId: string) => void,
    onAttached?: (resultId: string) => void
  ): Promise<string> {
    return this.handleServiceCompletion(
      {
        serviceType: ServiceType.NUMEROLOGY,
        resultData: calculationData,
        conversationId,
      },
      onSaved,
      onAttached
    );
  }

  /**
   * Tarot Service Handler
   */
  async handleTarot(
    readingData: any,
    conversationId?: string,
    onSaved?: (resultId: string) => void,
    onAttached?: (resultId: string) => void
  ): Promise<string> {
    return this.handleServiceCompletion(
      {
        serviceType: ServiceType.TAROT,
        resultData: readingData,
        conversationId,
      },
      onSaved,
      onAttached
    );
  }

  /**
   * Detect related results across services
   */
  async findRelatedResults(resultId: string): Promise<any[]> {
    try {
      // Get the current result
      const result = await ServiceResultsAPI.getResult(resultId);
      
      // Get all user results
      const allResults = await ServiceResultsAPI.getUserResults();
      
      // Filter out current result
      const otherResults = allResults.filter(r => r.id !== resultId);
      
      // For now, return results from different service types
      // In production, you might use AI to find semantic connections
      return otherResults.filter(r => r.serviceType !== result.serviceType);
    } catch (error) {
      console.error('Error finding related results:', error);
      return [];
    }
  }

  /**
   * Suggest complementary readings
   */
  getSuggestedReadings(currentType: ServiceType): ServiceType[] {
    const suggestions: Record<ServiceType, ServiceType[]> = {
      [ServiceType.PALM]: [ServiceType.ASTROLOGY, ServiceType.NUMEROLOGY],
      [ServiceType.ASTROLOGY]: [ServiceType.PALM, ServiceType.TAROT],
      [ServiceType.VASTU]: [ServiceType.NUMEROLOGY, ServiceType.ASTROLOGY],
      [ServiceType.NUMEROLOGY]: [ServiceType.PALM, ServiceType.ASTROLOGY],
      [ServiceType.TAROT]: [ServiceType.ASTROLOGY, ServiceType.PALM],
    };
    
    return suggestions[currentType] || [];
  }
}

export default new ServiceIntegration();

