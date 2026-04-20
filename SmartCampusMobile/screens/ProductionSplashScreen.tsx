import React, { useEffect, useState } from 'react';
import { View, Text, Image, Dimensions } from 'react-native';
import { MotiView } from 'moti';
import { School as SchoolIcon } from 'lucide-react-native';
import { GradientBox } from '../components/ui/GradientBox';
import apiClient from '../services/apiClient';
import { School } from '../models/SchoolModel';

const { width: _w, height: _h } = Dimensions.get('window');

interface ProductionSplashScreenProps {
  schoolId?: string;
}

const ProductionSplashScreen: React.FC<ProductionSplashScreenProps> = ({ schoolId }) => {
  const [school, setSchool] = useState<School | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const loadSchoolBranding = async () => {
      if (!schoolId) return;
      try {
        const res = await apiClient.get<{ data?: { school?: Record<string, unknown> } }>(`/schools/${schoolId}`);
        const raw = (res as { data?: { school?: Record<string, unknown> } }).data?.school;
        if (raw) {
          const branding = (raw.settings as { branding?: { primaryColor?: string; secondaryColor?: string; accentColor?: string } })?.branding;
          setSchool({
            id: (raw.id as string) ?? '',
            schoolId: (raw.id as string) ?? '',
            name: (raw.name as string) ?? 'Smart Campus',
            logo: raw.logoUrl ? { url: raw.logoUrl as string, fileName: 'logo', fileSize: 0, uploadedAt: new Date() } : {} as School['logo'],
            address: (raw.address as string) ?? '',
            city: (raw.city as string) ?? '',
            state: (raw.state as string) ?? '',
            zipCode: (raw.zipCode as string) ?? '',
            country: (raw.country as string) ?? '',
            phone: (raw.contactPhone as string) ?? '',
            email: (raw.contactEmail as string) ?? '',
            branding: branding
              ? { primaryColor: branding.primaryColor ?? '#3B82F6', secondaryColor: branding.secondaryColor ?? '#1E3A8A', accentColor: branding.accentColor ?? '#10B981' }
              : undefined,
            adminName: '',
            adminEmail: '',
            adminPhone: '',
            status: 'active',
            subscription: { plan: 'basic', validUntil: new Date(), features: [] },
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: '',
          } as School);
        }
      } catch (error) {
        console.error('Error loading school branding:', error);
      }
    };
    loadSchoolBranding();
  }, [schoolId]);

  const gradientColors = school?.branding
    ? [school.branding.primaryColor, school.branding.secondaryColor]
    : ['#3B82F6', '#1E3A8A', '#1E40AF'];

  return (
    <GradientBox colors={gradientColors}>
      <View style={styles.center}>
        <MotiView
          from={{ scale: 0.5, opacity: 0, rotate: '-180deg' }}
          animate={{ scale: 1, opacity: 1, rotate: '0deg' }}
          transition={{ type: 'spring', damping: 15, stiffness: 100 }}
        >
          <View style={styles.logoCircle}>
            {school?.logo?.url && !imageError ? (
              <Image
                source={{ uri: school.logo.url }}
                style={styles.logoImage}
                onError={() => setImageError(true)}
              />
            ) : (
              <SchoolIcon size={64} color="#FFFFFF" strokeWidth={2} />
            )}
          </View>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 30 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 800, delay: 400 }}
        >
          <Text style={styles.schoolName}>{school?.name || 'Smart Campus'}</Text>
        </MotiView>

        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 800, delay: 800 }}
        >
          <Text style={styles.tagline}>
            {school ? 'School Management System' : 'Connecting Schools, Parents & Students'}
          </Text>
        </MotiView>

        <MotiView
          from={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 600, delay: 1200, loop: true }}
          style={styles.dotsContainer}
        >
          <View style={styles.dotsRow}>
            {[0, 1, 2].map((index) => (
              <MotiView
                key={index}
                from={{ translateY: 0 }}
                animate={{ translateY: -10 }}
                transition={{ type: 'timing', duration: 600, delay: index * 200, loop: true, repeatReverse: true }}
              >
                <View style={styles.dot} />
              </MotiView>
            ))}
          </View>
        </MotiView>

        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ type: 'timing', duration: 800, delay: 1600 }}
          style={styles.version}
        >
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </MotiView>
      </View>
    </GradientBox>
  );
};

const styles = {
  center: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 32,
  },
  logoCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    overflow: 'hidden' as const,
  },
  logoImage: { width: 120, height: 120, borderRadius: 60 },
  schoolName: {
    fontSize: 40,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginTop: 32,
    textAlign: 'center' as const,
  },
  tagline: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 12,
    textAlign: 'center' as const,
  },
  dotsContainer: { position: 'absolute' as const, bottom: 100 },
  dotsRow: { flexDirection: 'row' as const, gap: 8 },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  version: { position: 'absolute' as const, bottom: 40 },
  versionText: { fontSize: 14, color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center' as const },
};

export default ProductionSplashScreen;
