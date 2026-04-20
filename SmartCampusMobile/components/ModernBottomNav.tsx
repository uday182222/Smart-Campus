import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SchoolRideColors, SchoolRideTypography } from '../theme/SchoolRideTheme';

const { width } = Dimensions.get('window');

interface NavItem {
  id: string;
  label: string;
  icon: string;
  onPress: () => void;
}

interface ModernBottomNavProps {
  items: NavItem[];
  activeItem: string;
}

const ModernBottomNav: React.FC<ModernBottomNavProps> = ({
  items,
  activeItem,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.blurContainer}>
        <View style={styles.navContent}>
          {items.map((item) => {
            const isActive = item.id === activeItem;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.navItem, isActive && styles.activeNavItem]}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, isActive && styles.activeIconContainer]}>
                  <Text style={[styles.icon, isActive && styles.activeIcon]}>
                    {item.icon}
                  </Text>
                </View>
                <Text style={[styles.label, isActive && styles.activeLabel]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  blurContainer: {
    flex: 1,
    backgroundColor: SchoolRideColors.glass.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: SchoolRideColors.glass.whiteBorder,
    overflow: 'hidden',
  },
  navContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 34,
    paddingHorizontal: 20,
    flex: 1,
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 8,
  },
  activeNavItem: {
    // Active state styling handled by child elements
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  activeIconContainer: {
    backgroundColor: SchoolRideColors.primary.start,
    shadowColor: SchoolRideColors.primary.start,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  icon: {
    fontSize: 20,
    color: SchoolRideColors.mediumGray,
  },
  activeIcon: {
    color: SchoolRideColors.white,
  },
  label: {
    fontFamily: SchoolRideTypography.fontFamily,
    fontWeight: SchoolRideTypography.weights.medium,
    fontSize: SchoolRideTypography.sizes.xs,
    color: SchoolRideColors.mediumGray,
    textAlign: 'center',
  },
  activeLabel: {
    color: SchoolRideColors.primary.start,
    fontWeight: SchoolRideTypography.weights.semibold,
  },
});

export default ModernBottomNav;
