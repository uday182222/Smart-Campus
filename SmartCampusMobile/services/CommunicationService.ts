import { Communication, CommunicationResponse, CommunicationStats, CommunicationType, CommunicationPriority, CommunicationStatus } from '../models/CommunicationModel';

export class CommunicationService {
  private static instance: CommunicationService;
  private communicationData: Communication[] = [];
  private responseData: CommunicationResponse[] = [];

  static getInstance(): CommunicationService {
    if (!CommunicationService.instance) {
      CommunicationService.instance = new CommunicationService();
      CommunicationService.instance.initializeMockData();
    }
    return CommunicationService.instance;
  }

  // Initialize mock data
  initializeMockData(): void {
    this.communicationData = [
      {
        id: 'comm_1',
        fromId: 'teacher_1',
        fromName: 'Ms. Sarah Wilson',
        fromRole: 'teacher',
        toId: 'parent_1',
        toName: 'Mrs. Johnson',
        toRole: 'parent',
        subject: 'Emma\'s Excellent Progress',
        message: 'I wanted to share that Emma has been doing exceptionally well in mathematics this week. Her problem-solving skills have improved significantly, and she\'s been very engaged in class discussions.',
        type: 'academic',
        priority: 'medium',
        status: 'read',
        studentId: 'student_1',
        studentName: 'Emma Johnson',
        classId: 'class_1',
        className: 'Grade 5A',
        createdAt: new Date('2025-01-14T10:30:00'),
        updatedAt: new Date('2025-01-14T10:30:00'),
        readAt: new Date('2025-01-14T15:45:00'),
      },
      {
        id: 'comm_2',
        fromId: 'teacher_1',
        fromName: 'Ms. Sarah Wilson',
        fromRole: 'teacher',
        toId: 'parent_2',
        toName: 'Mr. Wilson',
        toRole: 'parent',
        subject: 'James\'s Attendance Concern',
        message: 'I\'ve noticed that James has been absent for the past 3 days without prior notice. Could you please let me know if everything is alright? I\'m concerned about his missed lessons.',
        type: 'attendance',
        priority: 'high',
        status: 'sent',
        studentId: 'student_2',
        studentName: 'James Wilson',
        classId: 'class_1',
        className: 'Grade 5A',
        createdAt: new Date('2025-01-15T09:15:00'),
        updatedAt: new Date('2025-01-15T09:15:00'),
      },
      {
        id: 'comm_3',
        fromId: 'parent_3',
        fromName: 'Mrs. Davis',
        fromRole: 'parent',
        toId: 'teacher_1',
        toName: 'Ms. Sarah Wilson',
        toRole: 'teacher',
        subject: 'Sarah\'s Homework Question',
        message: 'Hi Ms. Wilson, Sarah is having trouble with the science homework assignment. Could you please clarify the experiment procedure? She\'s confused about step 3.',
        type: 'homework',
        priority: 'medium',
        status: 'replied',
        studentId: 'student_3',
        studentName: 'Sarah Davis',
        classId: 'class_2',
        className: 'Grade 5B',
        createdAt: new Date('2025-01-13T19:30:00'),
        updatedAt: new Date('2025-01-13T19:30:00'),
        readAt: new Date('2025-01-14T08:15:00'),
        repliedAt: new Date('2025-01-14T08:30:00'),
        responses: [
          {
            id: 'resp_1',
            communicationId: 'comm_3',
            fromId: 'teacher_1',
            fromName: 'Ms. Sarah Wilson',
            fromRole: 'teacher',
            message: 'Hi Mrs. Davis, I\'d be happy to help! For step 3, Sarah should add exactly 5ml of water to the mixture and stir gently for 30 seconds. Let me know if she needs any further clarification!',
            createdAt: new Date('2025-01-14T08:30:00'),
          },
        ],
      },
      {
        id: 'comm_4',
        fromId: 'admin_1',
        fromName: 'School Administration',
        fromRole: 'admin',
        toId: 'parent_1',
        toName: 'Mrs. Johnson',
        toRole: 'parent',
        subject: 'School Event Reminder',
        message: 'This is a friendly reminder that the Annual Science Fair is scheduled for next Friday, January 24th. Emma is registered to participate. Please ensure she arrives by 8:30 AM.',
        type: 'announcement',
        priority: 'medium',
        status: 'delivered',
        studentId: 'student_1',
        studentName: 'Emma Johnson',
        classId: 'class_1',
        className: 'Grade 5A',
        createdAt: new Date('2025-01-12T14:00:00'),
        updatedAt: new Date('2025-01-12T14:00:00'),
      },
      {
        id: 'comm_5',
        fromId: 'parent_2',
        fromName: 'Mr. Wilson',
        toId: 'teacher_1',
        toName: 'Ms. Sarah Wilson',
        fromRole: 'parent',
        toRole: 'teacher',
        subject: 'James\'s Absence Explanation',
        message: 'Hi Ms. Wilson, I apologize for not informing you earlier. James has been sick with the flu. He should be back to school by Monday. I\'ll send the medical certificate.',
        type: 'attendance',
        priority: 'medium',
        status: 'read',
        studentId: 'student_2',
        studentName: 'James Wilson',
        classId: 'class_1',
        className: 'Grade 5A',
        createdAt: new Date('2025-01-15T20:15:00'),
        updatedAt: new Date('2025-01-15T20:15:00'),
        readAt: new Date('2025-01-16T08:00:00'),
      },
    ];

    // Add responses to communication data
    this.communicationData[2].responses = [this.responseData[0]];
  }

  // Get communications for a user
  async getCommunicationsForUser(userId: string, userRole: string): Promise<Communication[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        let communications: Communication[] = [];
        
        if (userRole === 'teacher') {
          // Teachers see communications they sent or received
          communications = this.communicationData.filter(
            comm => comm.fromId === userId || comm.toId === userId
          );
        } else if (userRole === 'parent') {
          // Parents see communications about their children
          communications = this.communicationData.filter(
            comm => comm.toId === userId || comm.fromId === userId
          );
        } else if (userRole === 'admin') {
          // Admins see all communications
          communications = this.communicationData;
        }
        
        // Sort by creation date (newest first)
        communications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        resolve(communications);
      }, 400);
    });
  }

  // Get unread communications count
  async getUnreadCount(userId: string): Promise<number> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const unreadCount = this.communicationData.filter(
          comm => comm.toId === userId && comm.status !== 'read' && comm.status !== 'replied'
        ).length;
        resolve(unreadCount);
      }, 200);
    });
  }

  // Send new communication
  async sendCommunication(communication: Omit<Communication, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<{ success: boolean; communication?: Communication; message: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const newCommunication: Communication = {
            ...communication,
            id: `comm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            status: 'sent',
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          this.communicationData.push(newCommunication);
          resolve({ success: true, communication: newCommunication, message: 'Message sent successfully' });
        } catch (error) {
          resolve({ success: false, message: 'Failed to send message' });
        }
      }, 600);
    });
  }

  // Reply to communication
  async replyToCommunication(communicationId: string, response: Omit<CommunicationResponse, 'id' | 'createdAt'>): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const communication = this.communicationData.find(comm => comm.id === communicationId);
          if (communication) {
            const newResponse: CommunicationResponse = {
              ...response,
              id: `resp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              createdAt: new Date(),
            };

            if (!communication.responses) {
              communication.responses = [];
            }
            communication.responses.push(newResponse);
            communication.status = 'replied';
            communication.repliedAt = new Date();
            communication.updatedAt = new Date();

            this.responseData.push(newResponse);
            resolve({ success: true, message: 'Reply sent successfully' });
          } else {
            resolve({ success: false, message: 'Communication not found' });
          }
        } catch (error) {
          resolve({ success: false, message: 'Failed to send reply' });
        }
      }, 500);
    });
  }

  // Mark communication as read
  async markAsRead(communicationId: string, userId: string): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const communication = this.communicationData.find(comm => comm.id === communicationId);
          if (communication && communication.toId === userId) {
            if (communication.status === 'sent' || communication.status === 'delivered') {
              communication.status = 'read';
              communication.readAt = new Date();
              communication.updatedAt = new Date();
            }
            resolve({ success: true, message: 'Message marked as read' });
          } else {
            resolve({ success: false, message: 'Communication not found' });
          }
        } catch (error) {
          resolve({ success: false, message: 'Failed to mark as read' });
        }
      }, 300);
    });
  }

  // Get communication statistics
  async getCommunicationStats(userId: string, userRole: string): Promise<CommunicationStats> {
    return new Promise((resolve) => {
      setTimeout(() => {
        let userCommunications: Communication[] = [];
        
        if (userRole === 'teacher') {
          userCommunications = this.communicationData.filter(
            comm => comm.fromId === userId || comm.toId === userId
          );
        } else if (userRole === 'parent') {
          userCommunications = this.communicationData.filter(
            comm => comm.toId === userId || comm.fromId === userId
          );
        } else if (userRole === 'admin') {
          userCommunications = this.communicationData;
        }

        const totalMessages = userCommunications.length;
        const unreadMessages = userCommunications.filter(
          comm => comm.toId === userId && comm.status !== 'read' && comm.status !== 'replied'
        ).length;
        const urgentMessages = userCommunications.filter(
          comm => comm.priority === 'urgent' && comm.status !== 'archived'
        ).length;
        
        // Calculate response rate
        const messagesWithReplies = userCommunications.filter(comm => comm.responses && comm.responses.length > 0).length;
        const responseRate = totalMessages > 0 ? Math.round((messagesWithReplies / totalMessages) * 100) : 0;
        
        // Calculate average response time (mock data)
        const averageResponseTime = 4.5; // hours

        resolve({
          totalMessages,
          unreadMessages,
          urgentMessages,
          responseRate,
          averageResponseTime,
        });
      }, 400);
    });
  }

  // Get communications by type
  async getCommunicationsByType(userId: string, type: CommunicationType): Promise<Communication[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const communications = this.communicationData.filter(
          comm => (comm.fromId === userId || comm.toId === userId) && comm.type === type
        );
        resolve(communications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
      }, 300);
    });
  }

  // Archive communication
  async archiveCommunication(communicationId: string): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const communication = this.communicationData.find(comm => comm.id === communicationId);
          if (communication) {
            communication.status = 'archived';
            communication.updatedAt = new Date();
            resolve({ success: true, message: 'Message archived successfully' });
          } else {
            resolve({ success: false, message: 'Communication not found' });
          }
        } catch (error) {
          resolve({ success: false, message: 'Failed to archive message' });
        }
      }, 300);
    });
  }
}

export default CommunicationService.getInstance();
