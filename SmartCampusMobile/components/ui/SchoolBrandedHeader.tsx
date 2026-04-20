import React, { useEffect, useState } from 'react';
import { View, Text, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { School as SchoolIcon } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../services/apiClient';
import { School } from '../../models/SchoolModel';

interface SchoolBrandedHeaderProps {
  showLogo?: boolean;
  showName?: boolean;
  logoSize?: number;
  textColor?: string;
  variant?: 'header' | 'compact' | 'full';
}

export const SchoolBrandedHeader: React.FC<SchoolBrandedHeaderProps> = ({
  showLogo = true,
  showName = true,
  logoSize = 40,
  textColor = '#FFFFFF',
  variant = 'header',
}) => {
  const { userData } = useAuth();
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const loadSchoolData = async () => {
      if (!userData?.schoolId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await apiClient.get<{ data?: { school?: Record<string, unknown> } }>(`/schools/${userData.schoolId}`);
        const raw = (res as { data?: { school?: Record<string, unknown> } }).data?.school;
        if (raw) {
          setSchool({
            id: (raw.id as string) ?? '',
            schoolId: (raw.id as string) ?? '',
            name: (raw.name as string) ?? 'Smart Campus',
            logo: raw.logoUrl ? { url: raw.logoUrl as string, thumbnailUrl: raw.logoUrl as string, fileName: 'logo', fileSize: 0, uploadedAt: new Date() } : {} as School['logo'],
            address: (raw.address as string) ?? '',
            city: (raw.city as string) ?? '',
            state: (raw.state as string) ?? '',
            zipCode: (raw.zipCode as string) ?? '',
            country: (raw.country as string) ?? '',
            phone: (raw.contactPhone as string) ?? '',
            email: (raw.contactEmail as string) ?? '',
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
        console.error('Error loading school data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSchoolData();
  }, [userData?.schoolId]);

  const logoBox = (
    <View style={[styles.logoBox, { width: logoSize, height: logoSize, borderRadius: logoSize / 8 }]}>
      <SchoolIcon size={logoSize * 0.6} color={textColor} strokeWidth={2} />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.row}>
        <ActivityIndicator size="small" color={textColor} />
        {showName && <Text style={[styles.name, { color: textColor }, styles.loadingOpacity]}>Loading...</Text>}
      </View>
    );
  }

  if (!school) {
    return (
      <View style={styles.row}>
        {showLogo && logoBox}
        {showName && <Text style={[styles.nameLg, { color: textColor }]}>Smart Campus</Text>}
      </View>
    );
  }

  if (variant === 'compact') {
    return (
      <View style={styles.rowCompact}>
        {showLogo && school.logo?.thumbnailUrl && !imageError && (
          <Image
            source={{ uri: school.logo.thumbnailUrl || school.logo.url }}
            style={[styles.logoImage, { width: logoSize, height: logoSize, borderRadius: logoSize / 8 }]}
            onError={() => setImageError(true)}
          />
        )}
        {(imageError || !school.logo?.url) && showLogo && logoBox}
        {showName && (
          <Text style={[styles.nameMd, { color: textColor }]} numberOfLines={1}>{school.name}</Text>
        )}
      </View>
    );
  }

  if (variant === 'full') {
    return (
      <View style={styles.full}>
        {showLogo && (
          <View>
            {school.logo?.url && !imageError ? (
              <Image
                source={{ uri: school.logo.url }}
                style={[styles.logoImage, { width: logoSize, height: logoSize, borderRadius: logoSize / 8 }]}
                onError={() => setImageError(true)}
              />
            ) : (
              <View style={[styles.logoBox, { width: logoSize, height: logoSize, borderRadius: logoSize / 8 }]}>
                <SchoolIcon size={logoSize * 0.6} color={textColor} strokeWidth={2} />
              </View>
            )}
          </View>
        )}
        {showName && (
          <View style={styles.fullName}>
            <Text style={[styles.name2xl, { color: textColor, textAlign: 'center' }]}>{school.name}</Text>
            <Text style={[styles.muted, { color: textColor, textAlign: 'center' }]}>{school.city}, {school.state}</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.row}>
      {showLogo && (
        <View>
          {school.logo?.thumbnailUrl && !imageError ? (
            <Image
              source={{ uri: school.logo.thumbnailUrl || school.logo.url }}
              style={[styles.logoImage, { width: logoSize, height: logoSize, borderRadius: logoSize / 8 }]}
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={[styles.logoBox, { width: logoSize, height: logoSize, borderRadius: logoSize / 8 }]}>
              <SchoolIcon size={logoSize * 0.6} color={textColor} strokeWidth={2} />
            </View>
          )}
        </View>
      )}
      {showName && (
        <Text style={[styles.nameLg, { color: textColor }]} numberOfLines={2}>{school.name}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowCompact: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  full: { alignItems: 'center', gap: 12 },
  fullName: { alignItems: 'center' },
  logoBox: { backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center' },
  logoImage: {},
  name: { fontSize: 18, fontWeight: '700' },
  nameLg: { fontSize: 18, fontWeight: '700' },
  nameMd: { fontSize: 16, fontWeight: '600' },
  name2xl: { fontSize: 24, fontWeight: '700' },
  muted: { fontSize: 14, opacity: 0.8, marginTop: 4 },
  loadingOpacity: { opacity: 0.5 },
});
