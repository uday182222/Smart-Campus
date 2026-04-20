import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SchoolRideColors, SchoolRideTypography } from '../theme/SchoolRideTheme';

const { width } = Dimensions.get('window');

interface ModernHeaderProps {
  title: string;
  subtitle?: string;
  onProfilePress?: () => void;
  profileImage?: string;
  showProfile?: boolean;
}

const ModernHeader: React.FC<ModernHeaderProps> = ({
  title,
  subtitle,
  onProfilePress,
  profileImage,
  showProfile = true,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.greeting}>Good morning</Text>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        
        {showProfile && (
          <TouchableOpacity
            style={styles.profileContainer}
            onPress={onProfilePress}
            activeOpacity={0.8}
          >
            <View style={styles.profileCircle}>
              <Text style={styles.profileInitial}>
                {title.charAt(0).toUpperCase()}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: SchoolRideColors.primary.start,
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  textContainer: {
    flex: 1,
    paddingRight: 16,
  },
  greeting: {
    fontFamily: SchoolRideTypography.fontFamily,
    fontWeight: SchoolRideTypography.weights.regular,
    fontSize: SchoolRideTypography.sizes.base,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  title: {
    fontFamily: SchoolRideTypography.fontFamily,
    fontWeight: SchoolRideTypography.weights.semibold,
    fontSize: SchoolRideTypography.sizes['3xl'],
    color: SchoolRideColors.white,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: SchoolRideTypography.fontFamily,
    fontWeight: SchoolRideTypography.weights.regular,
    fontSize: SchoolRideTypography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  profileContainer: {
    alignItems: 'center',
  },
  profileCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: SchoolRideColors.shadow.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  profileInitial: {
    fontFamily: SchoolRideTypography.fontFamily,
    fontWeight: SchoolRideTypography.weights.semibold,
    fontSize: SchoolRideTypography.sizes.xl,
    color: SchoolRideColors.white,
  },
});

export default ModernHeader;
