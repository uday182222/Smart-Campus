/**
 * Accessibility Utilities
 * Helpers for screen reader support and keyboard navigation
 */

import { AccessibilityInfo, Platform } from 'react-native';

export class AccessibilityHelper {
  /**
   * Announce message to screen reader
   */
  static announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    if (Platform.OS === 'ios') {
      AccessibilityInfo.announceForAccessibility(message);
    } else {
      // Android supports announcement options
      AccessibilityInfo.announceForAccessibility(message);
    }
  }

  /**
   * Check if screen reader is enabled
   */
  static async isScreenReaderEnabled(): Promise<boolean> {
    return await AccessibilityInfo.isScreenReaderEnabled();
  }

  /**
   * Get accessible label for service result
   */
  static getResultLabel(serviceType: string, summary: string, date: Date): string {
    const timeAgo = this.getTimeAgoLabel(date);
    return `${serviceType} reading from ${timeAgo}. ${summary}`;
  }

  /**
   * Get time ago label for screen reader
   */
  static getTimeAgoLabel(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  }

  /**
   * Get accessible hint for button
   */
  static getButtonHint(action: string): string {
    return `Double tap to ${action}`;
  }

  /**
   * Create accessibility props for result card
   */
  static getResultCardAccessibility(
    serviceType: string,
    summary: string,
    date: Date,
    isNew: boolean,
    isReferenced: boolean
  ) {
    const badges: string[] = [];
    if (isNew) badges.push('new');
    if (isReferenced) badges.push('AI mentioned');

    const badgeText = badges.length > 0 ? `, ${badges.join(', ')}` : '';
    
    return {
      accessible: true,
      accessibilityRole: 'button' as const,
      accessibilityLabel: this.getResultLabel(serviceType, summary, date) + badgeText,
      accessibilityHint: 'Double tap to view full result',
    };
  }

  /**
   * Create accessibility props for attachment
   */
  static getAttachmentAccessibility(serviceType: string, expanded: boolean) {
    return {
      accessible: true,
      accessibilityRole: 'button' as const,
      accessibilityLabel: `${serviceType} reading attachment`,
      accessibilityHint: `Double tap to ${expanded ? 'collapse' : 'expand'}`,
      accessibilityState: {
        expanded,
      },
    };
  }

  /**
   * Focus management - set focus to element
   */
  static setFocus(ref: React.RefObject<any>) {
    if (ref.current) {
      AccessibilityInfo.setAccessibilityFocus(ref.current);
    }
  }

  /**
   * Announce new result saved
   */
  static announceResultSaved(serviceType: string) {
    this.announce(
      `${serviceType} reading saved successfully. You can now view it in your readings.`,
      'polite'
    );
  }

  /**
   * Announce result attached
   */
  static announceResultAttached(serviceType: string) {
    this.announce(
      `${serviceType} reading attached to chat`,
      'polite'
    );
  }

  /**
   * Announce AI reference
   */
  static announceAIReference(serviceType: string) {
    this.announce(
      `AI is referencing your ${serviceType} reading`,
      'polite'
    );
  }

  /**
   * Announce error
   */
  static announceError(message: string) {
    this.announce(
      `Error: ${message}`,
      'assertive'
    );
  }

  /**
   * Get keyboard navigation hint
   */
  static getKeyboardHint(key: string, action: string): string {
    return `Press ${key} to ${action}`;
  }
}

export default AccessibilityHelper;

