/**
 * Help Center Screen
 * Comprehensive help system with FAQs, guides, tutorials, and support
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Linking,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  helpful: number;
}

interface UserGuide {
  id: string;
  role: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  sections: GuideSection[];
}

interface GuideSection {
  title: string;
  content: string;
  videoUrl?: string;
}

const HelpCenterScreen: React.FC = ({ navigation }: any) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const categories = [
    { id: 'all', name: 'All', icon: 'help', color: '#4ECDC4' },
    { id: 'attendance', name: 'Attendance', icon: 'how-to-reg', color: '#3498DB' },
    { id: 'homework', name: 'Homework', icon: 'assignment', color: '#2ECC71' },
    { id: 'fees', name: 'Fees', icon: 'payment', color: '#E67E22' },
    { id: 'transport', name: 'Transport', icon: 'directions-bus', color: '#F39C12' },
    { id: 'calendar', name: 'Calendar', icon: 'event', color: '#9B59B6' },
    { id: 'gallery', name: 'Gallery', icon: 'photo-library', color: '#1ABC9C' },
  ];

  const faqs: FAQItem[] = [
    {
      id: '1',
      category: 'attendance',
      question: 'How do I mark attendance?',
      answer: 'Go to Attendance screen, select the date, tap on each student to mark present/absent. Don\'t forget to submit!',
      helpful: 45,
    },
    {
      id: '2',
      category: 'homework',
      question: 'How do I assign homework?',
      answer: 'Navigate to Homework section, tap "Add Homework", fill in subject, description, and due date, then submit.',
      helpful: 38,
    },
    {
      id: '3',
      category: 'fees',
      question: 'How do I send fee reminders?',
      answer: 'Go to Fee Management, select students with pending fees, and tap "Send Reminder". Choose Push or WhatsApp.',
      helpful: 52,
    },
    {
      id: '4',
      category: 'transport',
      question: 'How do I track the school bus?',
      answer: 'Open the Transport section, select your child\'s route, and view real-time location on the map with ETA.',
      helpful: 67,
    },
    {
      id: '5',
      category: 'calendar',
      question: 'How do I add events to the calendar?',
      answer: 'Go to Calendar Management, tap "+", fill in event details, select audience, and save. Notifications will be sent automatically.',
      helpful: 29,
    },
    {
      id: '6',
      category: 'gallery',
      question: 'How do I upload photos to the gallery?',
      answer: 'Navigate to Gallery, tap "Upload", select photos/videos, add captions and tags, choose visibility, then upload.',
      helpful: 41,
    },
    {
      id: '7',
      category: 'all',
      question: 'How do I reset my password?',
      answer: 'On the login screen, tap "Forgot Password", enter your email, and follow the instructions sent to your email.',
      helpful: 73,
    },
    {
      id: '8',
      category: 'all',
      question: 'Can I use the app offline?',
      answer: 'Yes! Most viewing features work offline. Changes will sync when you\'re back online. Bus helpers have full offline support.',
      helpful: 55,
    },
  ];

  const userGuides: UserGuide[] = [
    {
      id: '1',
      role: 'parent',
      title: 'Parent Guide',
      description: 'Complete guide for parents',
      icon: 'family-restroom',
      color: '#3498DB',
      sections: [
        {
          title: 'Getting Started',
          content: 'Learn how to navigate the app, view your child\'s information, and manage your profile.',
        },
        {
          title: 'Track Attendance',
          content: 'View daily attendance, check attendance history, and receive alerts.',
        },
        {
          title: 'Transport Tracking',
          content: 'Track school bus in real-time, view ETA, and receive notifications.',
          videoUrl: 'https://example.com/transport-guide.mp4',
        },
      ],
    },
    {
      id: '2',
      role: 'teacher',
      title: 'Teacher Guide',
      description: 'Complete guide for teachers',
      icon: 'school',
      color: '#2ECC71',
      sections: [
        {
          title: 'Mark Attendance',
          content: 'Step-by-step guide to marking daily attendance for your classes.',
        },
        {
          title: 'Assign Homework',
          content: 'Create homework assignments, set due dates, and track submissions.',
        },
        {
          title: 'Enter Marks',
          content: 'Record exam marks, add remarks, and generate reports.',
        },
      ],
    },
    {
      id: '3',
      role: 'admin',
      title: 'Admin Guide',
      description: 'Complete guide for administrators',
      icon: 'admin-panel-settings',
      color: '#9B59B6',
      sections: [
        {
          title: 'User Management',
          content: 'Add users, assign roles, and manage permissions.',
        },
        {
          title: 'Transport Management',
          content: 'Create routes, assign helpers, and manage student assignments.',
        },
      ],
    },
  ];

  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = searchQuery.trim() === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleFAQPress = (faqId: string) => {
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId);
  };

  const handleContactSupport = () => {
    navigation.navigate('SupportTicket');
  };

  const handleCallSupport = () => {
    Linking.openURL('tel:+911234567890');
  };

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@smartcampus.com?subject=Support Request');
  };

  const handleOpenGuide = (guide: UserGuide) => {
    navigation.navigate('UserGuide', { guide });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#4ECDC4', '#44A08D']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Help Center</Text>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <MaterialIcons name="search" size={20} color="#95A5A6" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for help..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#95A5A6"
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={handleContactSupport}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#3498DB' }]}>
                <MaterialIcons name="support-agent" size={28} color="#FFF" />
              </View>
              <Text style={styles.quickActionTitle}>Contact Support</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={handleCallSupport}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#2ECC71' }]}>
                <MaterialIcons name="phone" size={28} color="#FFF" />
              </View>
              <Text style={styles.quickActionTitle}>Call Support</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={handleEmailSupport}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#E67E22' }]}>
                <MaterialIcons name="email" size={28} color="#FFF" />
              </View>
              <Text style={styles.quickActionTitle}>Email Support</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* User Guides */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Guides</Text>
          {userGuides.map((guide) => (
            <TouchableOpacity
              key={guide.id}
              style={styles.guideCard}
              onPress={() => handleOpenGuide(guide)}
            >
              <View style={[styles.guideIcon, { backgroundColor: guide.color }]}>
                <MaterialIcons name={guide.icon as any} size={28} color="#FFF" />
              </View>
              <View style={styles.guideInfo}>
                <Text style={styles.guideTitle}>{guide.title}</Text>
                <Text style={styles.guideDescription}>{guide.description}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#95A5A6" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse by Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScroll}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  selectedCategory === category.id && styles.categoryChipActive,
                  selectedCategory === category.id && { backgroundColor: category.color },
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <MaterialIcons
                  name={category.icon as any}
                  size={16}
                  color={selectedCategory === category.id ? '#FFF' : '#7F8C8D'}
                />
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategory === category.id && styles.categoryChipTextActive,
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* FAQs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Frequently Asked Questions ({filteredFAQs.length})
          </Text>
          {filteredFAQs.map((faq) => (
            <TouchableOpacity
              key={faq.id}
              style={styles.faqCard}
              onPress={() => handleFAQPress(faq.id)}
            >
              <View style={styles.faqHeader}>
                <View style={styles.faqQuestion}>
                  <MaterialIcons
                    name="help"
                    size={20}
                    color="#4ECDC4"
                    style={styles.faqIcon}
                  />
                  <Text style={styles.faqQuestionText}>{faq.question}</Text>
                </View>
                <MaterialIcons
                  name={expandedFAQ === faq.id ? 'expand-less' : 'expand-more'}
                  size={24}
                  color="#95A5A6"
                />
              </View>

              {expandedFAQ === faq.id && (
                <View style={styles.faqAnswer}>
                  <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                  <View style={styles.faqFooter}>
                    <Text style={styles.faqHelpful}>
                      {faq.helpful} people found this helpful
                    </Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Still Need Help */}
        <View style={styles.stillNeedHelp}>
          <Text style={styles.stillNeedHelpTitle}>Still need help?</Text>
          <Text style={styles.stillNeedHelpText}>
            Our support team is here to assist you
          </Text>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={handleContactSupport}
          >
            <MaterialIcons name="support-agent" size={20} color="#FFF" />
            <Text style={styles.contactButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    padding: 20,
    backgroundColor: '#FFF',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#2C3E50',
  },
  section: {
    padding: 20,
    backgroundColor: '#FFF',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2C3E50',
    textAlign: 'center',
  },
  guideCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  guideIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  guideInfo: {
    flex: 1,
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  guideDescription: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  categoriesScroll: {
    marginBottom: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    marginRight: 8,
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: '#4ECDC4',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7F8C8D',
  },
  categoryChipTextActive: {
    color: '#FFF',
  },
  faqCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  faqQuestion: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'flex-start',
  },
  faqIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  faqQuestionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    flex: 1,
  },
  faqAnswer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  faqAnswerText: {
    fontSize: 14,
    color: '#7F8C8D',
    lineHeight: 22,
    marginBottom: 12,
  },
  faqFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqHelpful: {
    fontSize: 12,
    color: '#95A5A6',
  },
  stillNeedHelp: {
    backgroundColor: '#FFF',
    padding: 30,
    alignItems: 'center',
  },
  stillNeedHelpTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  stillNeedHelpText: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 20,
    textAlign: 'center',
  },
  contactButton: {
    flexDirection: 'row',
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    gap: 8,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default HelpCenterScreen;



