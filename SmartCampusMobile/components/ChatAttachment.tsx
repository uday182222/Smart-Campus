/**
 * Chat Attachment Component
 * Displays service results attached to chat messages
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ServiceResultsAPI, ServiceResult } from '../services/ServiceResultsAPI';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ChatAttachmentProps {
  results: ServiceResult[];
  onViewFull?: (result: ServiceResult) => void;
  onAskAbout?: (result: ServiceResult) => void;
  onRemove?: (resultId: string) => void;
}

const ChatAttachment: React.FC<ChatAttachmentProps> = ({
  results,
  onViewFull,
  onAskAbout,
  onRemove,
}) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const toggleExpanded = (resultId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(resultId)) {
        newSet.delete(resultId);
      } else {
        newSet.add(resultId);
      }
      return newSet;
    });
  };

  if (results.length === 0) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.header}>
        <MaterialIcons name="attach-file" size={16} color="#7F8C8D" />
        <Text style={styles.headerText}>
          {results.length} {results.length === 1 ? 'attachment' : 'attachments'}
        </Text>
      </View>

      {results.map((result, index) => {
        const isExpanded = expandedIds.has(result.id);
        const icon = ServiceResultsAPI.getServiceIcon(result.serviceType);
        const color = ServiceResultsAPI.getServiceColor(result.serviceType);
        const serviceName = ServiceResultsAPI.getServiceName(result.serviceType);

        return (
          <View
            key={result.id}
            style={[
              styles.attachmentCard,
              { borderLeftColor: color },
              index > 0 && styles.attachmentCardSpacing,
            ]}
          >
            {/* Collapsed State */}
            <TouchableOpacity
              style={styles.attachmentHeader}
              onPress={() => toggleExpanded(result.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBadge, { backgroundColor: `${color}20` }]}>
                <Text style={styles.iconText}>{icon}</Text>
              </View>

              <Text style={styles.attachmentTitle} numberOfLines={1}>
                {serviceName}
              </Text>

              <MaterialIcons
                name={isExpanded ? 'expand-less' : 'expand-more'}
                size={20}
                color="#95A5A6"
              />
            </TouchableOpacity>

            {/* Expanded State */}
            {isExpanded && (
              <View style={styles.expandedContent}>
                <Text style={styles.summary} numberOfLines={3}>
                  {result.summary}
                </Text>

                <View style={styles.actions}>
                  {onAskAbout && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.secondaryButton]}
                      onPress={() => onAskAbout(result)}
                    >
                      <MaterialIcons name="chat" size={16} color={color} />
                      <Text style={[styles.actionText, { color }]}>
                        Ask about this
                      </Text>
                    </TouchableOpacity>
                  )}

                  {onViewFull && (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: color }]}
                      onPress={() => onViewFull(result)}
                    >
                      <MaterialIcons name="visibility" size={16} color="#FFF" />
                      <Text style={styles.actionTextWhite}>View Full</Text>
                    </TouchableOpacity>
                  )}

                  {onRemove && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.removeButton]}
                      onPress={() => onRemove(result.id)}
                    >
                      <MaterialIcons name="close" size={16} color="#E74C3C" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </View>
        );
      })}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  headerText: {
    fontSize: 12,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  attachmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderLeftWidth: 3,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  attachmentCardSpacing: {
    marginTop: 8,
  },
  attachmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 16,
  },
  attachmentTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
  },
  expandedContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  summary: {
    fontSize: 13,
    lineHeight: 18,
    color: '#34495E',
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 4,
  },
  secondaryButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  removeButton: {
    flex: 0,
    backgroundColor: '#FFEBEE',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionTextWhite: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ChatAttachment;

