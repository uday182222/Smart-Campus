/**
 * Super Admin - Create School Screen
 * Allows super administrators to create new schools (info, logo, admin, review).
 */

import React, { useState } from 'react';
import { ScrollView, Image, Alert, StatusBar, TouchableOpacity, View, Text, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import * as ImagePicker from 'expo-image-picker';
import {
  Upload,
  Building,
  ArrowLeft,
  Check,
  Camera,
  User,
} from 'lucide-react-native';
import { AnimatedCard } from '../components/ui/AnimatedCard';
import { AnimatedButton } from '../components/ui/AnimatedButton';
import { GradientBox } from '../components/ui/GradientBox';
import apiClient from '../services/apiClient';
import { CreateSchoolInput } from '../models/SchoolModel';

interface SuperAdminCreateSchoolProps {
  navigation?: any;
}

const SuperAdminCreateSchool: React.FC<SuperAdminCreateSchoolProps> = ({ navigation }) => {
  const [formData, setFormData] = useState<CreateSchoolInput>({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
    phone: '',
    email: '',
    adminName: '',
    adminEmail: '',
    adminPhone: '',
  });

  const [logo, setLogo] = useState<{
    uri: string;
    file: Blob;
    fileName: string;
  } | null>(null);

  const [branding, setBranding] = useState({
    primaryColor: '#3B82F6',
    secondaryColor: '#1E3A8A',
    accentColor: '#10B981',
  });

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Info, 2: Logo, 3: Admin, 4: Review

  /**
   * Pick logo image from library
   */
  const pickLogo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant photo library access to upload school logo.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];

        // Convert to Blob
        const response = await fetch(asset.uri);
        const blob = await response.blob();

        setLogo({
          uri: asset.uri,
          file: blob,
          fileName: `logo_${Date.now()}.jpg`,
        });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  /**
   * Take photo for logo
   */
  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant camera access to take school logo photo.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const response = await fetch(asset.uri);
        const blob = await response.blob();

        setLogo({
          uri: asset.uri,
          file: blob,
          fileName: `logo_${Date.now()}.jpg`,
        });
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  /**
   * Create school (Node API: POST /schools)
   */
  const handleCreateSchool = async () => {
    if (!formData.name?.trim()) {
      Alert.alert('Validation Error', 'School name is required.');
      return;
    }
    if (!formData.email?.trim()) {
      Alert.alert('Validation Error', 'Contact email is required.');
      return;
    }

    try {
      setLoading(true);

      const res = await apiClient.post<{ data: { school: any } }>('/schools', {
        name: formData.name.trim(),
        address: formData.address?.trim() || [formData.city, formData.state, formData.zipCode, formData.country].filter(Boolean).join(', ') || formData.address,
        city: formData.city?.trim(),
        state: formData.state?.trim(),
        zipCode: formData.zipCode?.trim(),
        country: formData.country?.trim() || 'USA',
        contactEmail: formData.email.trim(),
        contactPhone: formData.phone?.trim() || undefined,
        logoUrl: logo?.uri ?? undefined,
      });

      const school = (res as any).data?.school ?? (res as any).data;

      Alert.alert(
        '🎉 School Created Successfully!',
        `School ID: ${school?.id ?? 'N/A'}\n\nPlease share this School ID with administrators. School Name: ${school?.name ?? formData.name}`,
        [
          { text: 'Create Another', onPress: () => resetForm() },
          { text: 'Done', onPress: () => navigation?.goBack(), style: 'cancel' as const },
        ]
      );
    } catch (error: any) {
      console.error('Error creating school:', error);
      Alert.alert('Error', error?.message || 'Failed to create school.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Reset form
   */
  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA',
      phone: '',
      email: '',
      adminName: '',
      adminEmail: '',
      adminPhone: '',
    });
    setLogo(null);
    setBranding({
      primaryColor: '#3B82F6',
      secondaryColor: '#1E3A8A',
      accentColor: '#10B981',
    });
    setStep(1);
  };

  /**
   * Render header
   */
  const renderHeader = () => (
    <GradientBox colors={['#3B82F6', '#1E3A8A']} style={{ height: 'auto' }}>
      <SafeAreaView>
        <StatusBar barStyle="light-content" />
        <View style={styles.headerPadding}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation?.goBack()}>
              <View style={styles.backButton}>
                <ArrowLeft size={24} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create New School</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={styles.progressRow}>
            {[1, 2, 3, 4].map((s) => (
              <View
                key={s}
                style={[styles.progressDot, { backgroundColor: step >= s ? '#FFFFFF' : 'rgba(255, 255, 255, 0.3)' }]}
              />
            ))}
          </View>
          <Text style={styles.stepText}>Step {step} of 4</Text>
        </View>
      </SafeAreaView>
    </GradientBox>
  );

  /**
   * Render step 1: School Information
   */
  const renderStep1 = () => (
    <View style={styles.stepPadding}>
      <AnimatedCard variant="elevated" padding={20} delay={100}>
        <View style={styles.sectionRow}>
          <Building size={24} color="#3B82F6" />
          <Text style={styles.sectionTitle}>School Information</Text>
        </View>
        <View style={styles.fieldBlock}>
          <Text style={styles.label}>School Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="Lotus Public School"
          />
        </View>
        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={styles.input}
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            placeholder="info@school.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Phone *</Text>
          <TextInput
            style={styles.input}
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            placeholder="+1-555-123-4567"
            keyboardType="phone-pad"
          />
        </View>
        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Address *</Text>
          <TextInput
            style={styles.input}
            value={formData.address}
            onChangeText={(text) => setFormData({ ...formData, address: text })}
            placeholder="123 Main Street"
          />
        </View>
        <View style={styles.twoCol}>
          <View style={styles.half}>
            <Text style={styles.label}>City *</Text>
            <TextInput
              style={styles.input}
              value={formData.city}
              onChangeText={(text) => setFormData({ ...formData, city: text })}
              placeholder="City"
            />
          </View>
          <View style={styles.half}>
            <Text style={styles.label}>State *</Text>
            <TextInput
              style={styles.input}
              value={formData.state}
              onChangeText={(text) => setFormData({ ...formData, state: text })}
              placeholder="CA"
              maxLength={2}
              autoCapitalize="characters"
            />
          </View>
        </View>
        <View style={styles.twoCol}>
          <View style={styles.half}>
            <Text style={styles.label}>ZIP Code</Text>
            <TextInput
              style={styles.input}
              value={formData.zipCode}
              onChangeText={(text) => setFormData({ ...formData, zipCode: text })}
              placeholder="12345"
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.half}>
            <Text style={styles.label}>Country</Text>
            <TextInput
              style={styles.input}
              value={formData.country}
              onChangeText={(text) => setFormData({ ...formData, country: text })}
              placeholder="USA"
            />
          </View>
        </View>
      </AnimatedCard>
      <AnimatedButton variant="primary" size="lg" onPress={() => setStep(2)} style={styles.topButton}>
        Next: Upload Logo
      </AnimatedButton>
    </View>
  );

  /**
   * Render step 2: Logo Upload
   */
  const renderStep2 = () => (
    <View style={styles.stepPadding}>
      <AnimatedCard variant="elevated" padding={20} delay={100}>
        <View style={styles.sectionRow}>
          <Camera size={24} color="#3B82F6" />
          <Text style={styles.sectionTitle}>School Logo</Text>
        </View>
        {logo ? (
          <View style={styles.logoPreview}>
            <Image source={{ uri: logo.uri }} style={styles.logoImage} />
            <View style={styles.buttonRow}>
              <AnimatedButton variant="outline" onPress={pickLogo}>Change Logo</AnimatedButton>
              <AnimatedButton variant="ghost" onPress={() => setLogo(null)}>Remove</AnimatedButton>
            </View>
          </View>
        ) : (
          <View style={styles.buttonCol}>
            <AnimatedButton variant="primary" onPress={pickLogo} leftIcon={<Upload size={20} color="#FFFFFF" />} size="lg">
              Choose from Library
            </AnimatedButton>
            <AnimatedButton variant="outline" onPress={takePhoto} leftIcon={<Camera size={20} color="#3B82F6" />} size="lg">
              Take Photo
            </AnimatedButton>
          </View>
        )}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Logo Guidelines:</Text>
          <Text style={styles.infoText}>
            • Square image (1:1 ratio){'\n'}• Minimum 512x512 pixels{'\n'}• Maximum 5MB file size{'\n'}• PNG or JPG format{'\n'}• Clear and recognizable
          </Text>
        </View>
      </AnimatedCard>
      <View style={styles.navRow}>
        <AnimatedButton variant="outline" onPress={() => setStep(1)} style={styles.flex1}>Back</AnimatedButton>
        <AnimatedButton variant="primary" onPress={() => setStep(3)} isDisabled={!logo} style={styles.flex1}>
          Next: Admin Details
        </AnimatedButton>
      </View>
    </View>
  );

  /**
   * Render step 3: Administrator Details
   */
  const renderStep3 = () => (
    <View style={styles.stepPadding}>
      <AnimatedCard variant="elevated" padding={20} delay={100}>
        <View style={styles.sectionRow}>
          <User size={24} color="#3B82F6" />
          <Text style={styles.sectionTitle}>School Administrator</Text>
        </View>
        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.adminName}
            onChangeText={(text) => setFormData({ ...formData, adminName: text })}
            placeholder="John Doe"
          />
        </View>
        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={styles.input}
            value={formData.adminEmail}
            onChangeText={(text) => setFormData({ ...formData, adminEmail: text })}
            placeholder="admin@school.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Phone *</Text>
          <TextInput
            style={styles.input}
            value={formData.adminPhone}
            onChangeText={(text) => setFormData({ ...formData, adminPhone: text })}
            placeholder="+1-555-987-6543"
            keyboardType="phone-pad"
          />
        </View>
        <View style={[styles.infoBox, styles.warningBox]}>
          <Text style={styles.infoText}>The administrator will receive login credentials via email to set up their account.</Text>
        </View>
      </AnimatedCard>
      <View style={styles.navRow}>
        <AnimatedButton variant="outline" onPress={() => setStep(2)} style={styles.flex1}>Back</AnimatedButton>
        <AnimatedButton variant="primary" onPress={() => setStep(4)} style={styles.flex1}>Review & Create</AnimatedButton>
      </View>
    </View>
  );

  /**
   * Render step 4: Review
   */
  const renderStep4 = () => (
    <View style={styles.stepPadding}>
      <AnimatedCard variant="elevated" padding={20} delay={100}>
        <Text style={styles.reviewTitle}>Review School Details</Text>
        {logo && (
          <View style={styles.reviewLogoWrap}>
            <Image source={{ uri: logo.uri }} style={styles.reviewLogo} />
          </View>
        )}
        <View style={styles.reviewBlock}>
          <Text style={styles.label}>School Name</Text>
          <Text style={styles.reviewValue}>{formData.name}</Text>
        </View>
        <View style={styles.reviewBlock}>
          <Text style={styles.label}>Location</Text>
          <Text style={styles.reviewValue}>{formData.address}, {formData.city}, {formData.state} {formData.zipCode}</Text>
        </View>
        <View style={styles.reviewBlock}>
          <Text style={styles.label}>Contact</Text>
          <Text style={styles.reviewValue}>{formData.email}</Text>
          <Text style={styles.reviewValue}>{formData.phone}</Text>
        </View>
        <View style={styles.reviewBlock}>
          <Text style={styles.label}>Administrator</Text>
          <Text style={[styles.reviewValue, { fontWeight: '600' }]}>{formData.adminName}</Text>
          <Text style={styles.reviewValue}>{formData.adminEmail}</Text>
          <Text style={styles.reviewValue}>{formData.adminPhone}</Text>
        </View>
        <View style={styles.reviewBlock}>
          <Text style={styles.label}>Brand Colors</Text>
          <View style={styles.colorRow}>
            <View style={[styles.colorSwatch, { backgroundColor: branding.primaryColor }]} />
            <View style={[styles.colorSwatch, { backgroundColor: branding.secondaryColor }]} />
            <View style={[styles.colorSwatch, { backgroundColor: branding.accentColor }]} />
          </View>
        </View>
      </AnimatedCard>
      <View style={[styles.navRow, styles.navRowBottom]}>
        <AnimatedButton variant="outline" onPress={() => setStep(3)} style={styles.flex1}>Back</AnimatedButton>
        <AnimatedButton
          variant="primary"
          onPress={handleCreateSchool}
          isDisabled={loading}
          leftIcon={loading ? undefined : <Check size={20} color="#FFFFFF" />}
          style={styles.flex2}
        >
          {loading ? 'Creating School...' : 'Create School'}
        </AnimatedButton>
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      {renderHeader()}
      <ScrollView showsVerticalScrollIndicator={false}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  headerPadding: { padding: 20, paddingTop: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  progressRow: { flexDirection: 'row', marginTop: 20, gap: 8 },
  progressDot: { flex: 1, height: 4, borderRadius: 2 },
  stepText: { fontSize: 14, color: 'rgba(255, 255, 255, 0.8)', marginTop: 12, textAlign: 'center' },
  stepPadding: { padding: 20 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B', marginLeft: 8 },
  fieldBlock: { marginBottom: 16 },
  label: { fontSize: 14, color: '#64748B', marginBottom: 8 },
  input: { backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#1E293B' },
  twoCol: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  half: { flex: 1 },
  topButton: { marginTop: 20 },
  navRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  navRowBottom: { marginBottom: 40 },
  flex1: { flex: 1 },
  flex2: { flex: 2 },
  logoPreview: { alignItems: 'center', marginBottom: 16 },
  logoImage: { width: 200, height: 200, borderRadius: 16, marginBottom: 16 },
  buttonRow: { flexDirection: 'row', gap: 12 },
  buttonCol: { gap: 12 },
  infoBox: { backgroundColor: '#EFF6FF', padding: 16, borderRadius: 12, marginTop: 16, borderLeftWidth: 4, borderLeftColor: '#3B82F6' },
  warningBox: { backgroundColor: '#FFFBEB', borderLeftColor: '#F59E0B' },
  infoTitle: { fontSize: 14, color: '#1E293B', fontWeight: '600', marginBottom: 8 },
  infoText: { fontSize: 14, color: '#64748B' },
  reviewTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B', marginBottom: 20 },
  reviewLogoWrap: { alignItems: 'center', marginBottom: 20 },
  reviewLogo: { width: 120, height: 120, borderRadius: 12 },
  reviewBlock: { marginBottom: 16 },
  reviewValue: { fontSize: 16, color: '#1E293B', marginTop: 4 },
  colorRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  colorSwatch: { width: 50, height: 50, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
});

export default SuperAdminCreateSchool;

