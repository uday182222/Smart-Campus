import ServiceResultService from '../services/serviceResult.service';
import OpenAIService, { ServiceType } from '../services/openai.service';
import prisma from '../config/database';

// Mock Prisma
jest.mock('../config/database', () => ({
  __esModule: true,
  default: {
    serviceResult: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    message: {
      updateMany: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// Mock OpenAI Service
jest.mock('../services/openai.service');

// Mock Redis
jest.mock('../config/redis', () => ({
  getCache: jest.fn(),
  setCache: jest.fn(),
  deleteCache: jest.fn(),
  deleteCachePattern: jest.fn(),
}));

describe('ServiceResultService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveResult', () => {
    it('should save a service result with summary and embedding', async () => {
      const mockSummary = 'Your palm reading shows a strong life line...';
      const mockEmbedding = Array(1536).fill(0.5);
      const mockResult = {
        id: 'result-123',
        userId: 'user-123',
        conversationId: null,
        serviceType: 'PALM',
        resultData: { lines: { lifeLine: 'strong' } },
        summary: mockSummary,
        attachmentPosition: null,
        isDeleted: false,
        createdAt: new Date(),
        lastReferencedAt: null,
        updatedAt: new Date(),
      };

      (OpenAIService.generateSummary as jest.Mock).mockResolvedValue(mockSummary);
      (OpenAIService.generateEmbedding as jest.Mock).mockResolvedValue(mockEmbedding);
      (prisma.serviceResult.create as jest.Mock).mockResolvedValue(mockResult);

      const result = await ServiceResultService.saveResult({
        userId: 'user-123',
        serviceType: ServiceType.PALM,
        resultData: { lines: { lifeLine: 'strong' } },
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('result-123');
      expect(result.summary).toBe(mockSummary);
      expect(OpenAIService.generateSummary).toHaveBeenCalledWith(
        ServiceType.PALM,
        { lines: { lifeLine: 'strong' } }
      );
    });
  });

  describe('getUserResults', () => {
    it('should fetch user results with filters', async () => {
      const mockResults = [
        {
          id: 'result-1',
          serviceType: 'PALM',
          summary: 'Summary 1',
          createdAt: new Date(),
        },
        {
          id: 'result-2',
          serviceType: 'ASTROLOGY',
          summary: 'Summary 2',
          createdAt: new Date(),
        },
      ];

      (prisma.serviceResult.findMany as jest.Mock).mockResolvedValue(mockResults);

      const results = await ServiceResultService.getUserResults('user-123', {
        limit: 10,
        offset: 0,
      });

      expect(results).toHaveLength(2);
      expect(prisma.serviceResult.findMany).toHaveBeenCalled();
    });
  });

  describe('findRelevantResults', () => {
    it('should find relevant results using semantic search', async () => {
      const mockQueryEmbedding = Array(1536).fill(0.6);
      const mockResults = [
        {
          id: 'result-1',
          userId: 'user-123',
          serviceType: 'PALM',
          summary: 'Palm reading summary',
          resultData: {},
          isDeleted: false,
          createdAt: new Date(),
          lastReferencedAt: null,
          updatedAt: new Date(),
          conversationId: null,
          attachmentPosition: null,
        },
      ];

      (OpenAIService.generateEmbedding as jest.Mock).mockResolvedValue(mockQueryEmbedding);
      (OpenAIService.detectServiceTypeFromQuery as jest.Mock).mockReturnValue(ServiceType.PALM);
      (OpenAIService.detectTimeReference as jest.Mock).mockReturnValue(null);
      (OpenAIService.cosineSimilarity as jest.Mock).mockReturnValue(0.85);
      (prisma.serviceResult.findMany as jest.Mock).mockResolvedValue(mockResults);

      const results = await ServiceResultService.findRelevantResults(
        'user-123',
        'Tell me about my palm reading',
        3
      );

      expect(results).toBeDefined();
      expect(OpenAIService.generateEmbedding).toHaveBeenCalled();
    });
  });

  describe('deleteResult', () => {
    it('should soft delete a result', async () => {
      const mockResult = {
        id: 'result-123',
        userId: 'user-123',
      };

      (prisma.serviceResult.findFirst as jest.Mock).mockResolvedValue(mockResult);
      (prisma.serviceResult.update as jest.Mock).mockResolvedValue({ ...mockResult, isDeleted: true });
      (prisma.message.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

      const deleted = await ServiceResultService.deleteResult('result-123', 'user-123');

      expect(deleted).toBe(true);
      expect(prisma.serviceResult.update).toHaveBeenCalledWith({
        where: { id: 'result-123' },
        data: { isDeleted: true },
      });
    });

    it('should return false if result not found', async () => {
      (prisma.serviceResult.findFirst as jest.Mock).mockResolvedValue(null);

      const deleted = await ServiceResultService.deleteResult('result-123', 'user-123');

      expect(deleted).toBe(false);
    });
  });
});

describe('OpenAIService', () => {
  describe('detectServiceTypeFromQuery', () => {
    it('should detect palm reading from query', () => {
      const result = OpenAIService.detectServiceTypeFromQuery('Tell me about my palm reading');
      expect(result).toBe(ServiceType.PALM);
    });

    it('should detect astrology from query', () => {
      const result = OpenAIService.detectServiceTypeFromQuery('What does my birth chart say?');
      expect(result).toBe(ServiceType.ASTROLOGY);
    });

    it('should detect tarot from query', () => {
      const result = OpenAIService.detectServiceTypeFromQuery('Explain my tarot cards');
      expect(result).toBe(ServiceType.TAROT);
    });

    it('should return null for unknown query', () => {
      const result = OpenAIService.detectServiceTypeFromQuery('Hello there');
      expect(result).toBeNull();
    });
  });

  describe('detectTimeReference', () => {
    it('should detect latest reference', () => {
      expect(OpenAIService.detectTimeReference('my last reading')).toBe('latest');
      expect(OpenAIService.detectTimeReference('recent results')).toBe('latest');
    });

    it('should detect oldest reference', () => {
      expect(OpenAIService.detectTimeReference('my first reading')).toBe('oldest');
      expect(OpenAIService.detectTimeReference('earliest result')).toBe('oldest');
    });

    it('should return null for no time reference', () => {
      expect(OpenAIService.detectTimeReference('my palm reading')).toBeNull();
    });
  });

  describe('cosineSimilarity', () => {
    it('should calculate cosine similarity correctly', () => {
      const vecA = [1, 0, 0];
      const vecB = [1, 0, 0];
      const similarity = OpenAIService.cosineSimilarity(vecA, vecB);
      expect(similarity).toBeCloseTo(1.0, 5);
    });

    it('should return 0 for orthogonal vectors', () => {
      const vecA = [1, 0, 0];
      const vecB = [0, 1, 0];
      const similarity = OpenAIService.cosineSimilarity(vecA, vecB);
      expect(similarity).toBeCloseTo(0.0, 5);
    });

    it('should throw error for different length vectors', () => {
      const vecA = [1, 0];
      const vecB = [1, 0, 0];
      expect(() => OpenAIService.cosineSimilarity(vecA, vecB)).toThrow();
    });
  });

  describe('buildEnhancedContext', () => {
    it('should build context with relevant results', () => {
      const results = [
        {
          id: 'result-1',
          serviceType: ServiceType.PALM,
          summary: 'Strong life line indicates longevity',
          createdAt: new Date('2024-01-01'),
        },
        {
          id: 'result-2',
          serviceType: ServiceType.ASTROLOGY,
          summary: 'Venus in 7th house shows strong relationships',
          createdAt: new Date('2024-01-02'),
        },
      ];

      const context = OpenAIService.buildEnhancedContext('Tell me about career', results);

      expect(context).toContain('AVAILABLE PAST READINGS');
      expect(context).toContain('PALM READING');
      expect(context).toContain('ASTROLOGY READING');
      expect(context).toContain('result-1');
      expect(context).toContain('result-2');
    });

    it('should return empty string for no results', () => {
      const context = OpenAIService.buildEnhancedContext('Tell me about career', []);
      expect(context).toBe('');
    });
  });
});

