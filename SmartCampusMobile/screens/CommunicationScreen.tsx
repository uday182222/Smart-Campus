import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  FlatList,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import CommunicationService from '../services/CommunicationService';
import { Communication, CommunicationStats, CommunicationType, CommunicationPriority } from '../models/CommunicationModel';

const CommunicationScreen: React.FC = () => {
  const { userData } = useAuth();
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [stats, setStats] = useState<CommunicationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Communication | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // New message form state
  const [newMessage, setNewMessage] = useState({
    toId: '',
    toName: '',
    subject: '',
    message: '',
    type: 'general' as CommunicationType,
    priority: 'medium' as CommunicationPriority,
  });

  // Reply form state
  const [replyMessage, setReplyMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load communications for user
      const userCommunications = await CommunicationService.getCommunicationsForUser('teacher_1', 'teacher');
      setCommunications(userCommunications);
      
      // Load communication statistics
      const communicationStats = await CommunicationService.getCommunicationStats('teacher_1', 'teacher');
      setStats(communicationStats);
      
      // Load unread count
      const unread = await CommunicationService.getUnreadCount('teacher_1');
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error loading communication data:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendNewMessage = async () => {
    if (!newMessage.toId || !newMessage.subject || !newMessage.message) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const communicationData = {
        fromId: 'teacher_1',
        fromName: 'Ms. Sarah Wilson',
        fromRole: 'teacher',
        toId: newMessage.toId,
        toName: newMessage.toName,
        toRole: 'parent',
        subject: newMessage.subject,
        message: newMessage.message,
        type: newMessage.type,
        priority: newMessage.priority,
        studentId: 'student_1',
        studentName: 'Emma Johnson',
        classId: 'class_1',
        className: 'Grade 5A',
      };

      const result = await CommunicationService.sendCommunication(communicationData);
      
      if (result.success) {
        setNewMessage({
          toId: '',
          toName: '',
          subject: '',
          message: '',
          type: 'general',
          priority: 'medium',
        });
        setShowNewMessageModal(false);
        await loadData();
        Alert.alert('Success', 'Message sent successfully');
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const sendReply = async () => {
    if (!selectedMessage || !replyMessage.trim()) {
      Alert.alert('Error', 'Please enter a reply message');
      return;
    }

    try {
      const responseData = {
        communicationId: selectedMessage.id,
        fromId: 'teacher_1',
        fromName: 'Ms. Sarah Wilson',
        fromRole: 'teacher',
        message: replyMessage,
      };

      const result = await CommunicationService.replyToCommunication(selectedMessage.id, responseData);
      
      if (result.success) {
        setReplyMessage('');
        await loadData();
        Alert.alert('Success', 'Reply sent successfully');
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send reply');
    }
  };

  const markAsRead = async (communicationId: string) => {
    try {
      const result = await CommunicationService.markAsRead(communicationId, 'teacher_1');
      if (result.success) {
        await loadData();
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const getTypeIcon = (type: CommunicationType) => {
    switch (type) {
      case 'attendance': return '📊';
      case 'homework': return '📝';
      case 'academic': return '🎓';
      case 'behavior': return '👥';
      case 'health': return '🏥';
      case 'transport': return '🚌';
      case 'fee': return '💰';
      case 'emergency': return '🚨';
      case 'announcement': return '📢';
      default: return '💬';
    }
  };

  const getPriorityColor = (priority: CommunicationPriority) => {
    switch (priority) {
      case 'urgent': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'medium': return '#3B82F6';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'read': return '#10B981';
      case 'replied': return '#6366F1';
      case 'delivered': return '#3B82F6';
      case 'sent': return '#F59E0B';
      case 'archived': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 1) return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#6366F1" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6366F1" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>💬 Parent Communication</Text>
          <Text style={styles.headerSubtitle}>Connect with parents and guardians</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{unreadCount}</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Statistics Cards */}
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.totalMessages}</Text>
              <Text style={styles.statLabel}>Total Messages</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.unreadMessages}</Text>
              <Text style={styles.statLabel}>Unread</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.urgentMessages}</Text>
              <Text style={styles.statLabel}>Urgent</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.responseRate}%</Text>
              <Text style={styles.statLabel}>Response Rate</Text>
            </View>
          </View>
        )}

        {/* New Message Button */}
        <TouchableOpacity 
          style={styles.newMessageButton}
          onPress={() => setShowNewMessageModal(true)}
        >
          <Text style={styles.newMessageButtonText}>+ New Message</Text>
        </TouchableOpacity>

        {/* Messages List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Messages ({communications.length})</Text>
          {communications.map((message) => (
            <TouchableOpacity
              key={message.id}
              style={[
                styles.messageCard,
                message.status === 'sent' && styles.messageCardUnread
              ]}
              onPress={() => {
                setSelectedMessage(message);
                setShowMessageModal(true);
                markAsRead(message.id);
              }}
            >
              <View style={styles.messageHeader}>
                <View style={styles.messageInfo}>
                  <Text style={styles.messageType}>{getTypeIcon(message.type)} {message.type}</Text>
                  <Text style={styles.messageFrom}>
                    {message.fromId === 'teacher_1' ? `To: ${message.toName}` : `From: ${message.fromName}`}
                  </Text>
                </View>
                <View style={styles.messageMeta}>
                  <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(message.priority) }]}>
                    <Text style={styles.priorityText}>{message.priority}</Text>
                  </View>
                  <Text style={styles.messageTime}>{formatDate(message.createdAt)}</Text>
                </View>
              </View>
              
              <Text style={styles.messageSubject}>{message.subject}</Text>
              <Text style={styles.messagePreview} numberOfLines={2}>
                {message.message}
              </Text>
              
              <View style={styles.messageFooter}>
                <Text style={styles.studentInfo}>
                  {message.studentName} • {message.className}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(message.status) }]}>
                  <Text style={styles.statusText}>{message.status}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* New Message Modal */}
      <Modal
        visible={showNewMessageModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowNewMessageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Message</Text>
            
            <TextInput
              style={styles.input}
              placeholder="To (Parent Name)"
              value={newMessage.toName}
              onChangeText={(text) => setNewMessage({...newMessage, toName: text, toId: `parent_${text.toLowerCase().replace(' ', '_')}`})}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Subject"
              value={newMessage.subject}
              onChangeText={(text) => setNewMessage({...newMessage, subject: text})}
            />
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Your message..."
              value={newMessage.message}
              onChangeText={(text) => setNewMessage({...newMessage, message: text})}
              multiline
              numberOfLines={6}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowNewMessageModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.sendButton}
                onPress={sendNewMessage}
              >
                <Text style={styles.sendButtonText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Message Details Modal */}
      <Modal
        visible={showMessageModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMessageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedMessage && (
              <>
                <Text style={styles.modalTitle}>{selectedMessage.subject}</Text>
                
                <View style={styles.messageDetailsHeader}>
                  <Text style={styles.messageDetailsFrom}>
                    {selectedMessage.fromId === 'teacher_1' ? `To: ${selectedMessage.toName}` : `From: ${selectedMessage.fromName}`}
                  </Text>
                  <Text style={styles.messageDetailsTime}>
                    {selectedMessage.createdAt.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>
                
                <ScrollView style={styles.messageDetailsContent}>
                  <Text style={styles.messageDetailsText}>{selectedMessage.message}</Text>
                  
                  {/* Show responses if any */}
                  {selectedMessage.responses && selectedMessage.responses.length > 0 && (
                    <View style={styles.responsesSection}>
                      <Text style={styles.responsesTitle}>Replies:</Text>
                      {selectedMessage.responses.map((response) => (
                        <View key={response.id} style={styles.responseCard}>
                          <Text style={styles.responseFrom}>{response.fromName}</Text>
                          <Text style={styles.responseTime}>
                            {response.createdAt.toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Text>
                          <Text style={styles.responseMessage}>{response.message}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </ScrollView>

                {/* Reply Section */}
                <View style={styles.replySection}>
                  <TextInput
                    style={[styles.input, styles.replyInput]}
                    placeholder="Type your reply..."
                    value={replyMessage}
                    onChangeText={setReplyMessage}
                    multiline
                    numberOfLines={3}
                  />
                  <TouchableOpacity 
                    style={styles.replyButton}
                    onPress={sendReply}
                  >
                    <Text style={styles.replyButtonText}>Send Reply</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={() => setShowMessageModal(false)}
                >
                  <Text style={styles.modalCloseButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#6366F1',
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#6366F1',
    padding: 20,
    paddingTop: 10,
  },
  headerContent: {
    position: 'relative',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  unreadBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  newMessageButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  newMessageButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  messageCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  messageCardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: '#6366F1',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  messageInfo: {
    flex: 1,
  },
  messageType: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '500',
    marginBottom: 2,
  },
  messageFrom: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  messageMeta: {
    alignItems: 'flex-end',
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  priorityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  messageTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  messageSubject: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  messagePreview: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studentInfo: {
    fontSize: 12,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    backgroundColor: '#6B7280',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  sendButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  messageDetailsHeader: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  messageDetailsFrom: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  messageDetailsTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  messageDetailsContent: {
    maxHeight: 300,
    marginBottom: 16,
  },
  messageDetailsText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 16,
  },
  responsesSection: {
    marginTop: 16,
  },
  responsesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  responseCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  responseFrom: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  responseTime: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  responseMessage: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  replySection: {
    marginBottom: 16,
  },
  replyInput: {
    marginBottom: 12,
  },
  replyButton: {
    backgroundColor: '#6366F1',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  replyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalCloseButton: {
    backgroundColor: '#6B7280',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CommunicationScreen;