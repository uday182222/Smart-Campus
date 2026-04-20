/**
 * Smart Campus — Profile (light theme).
 */

import React from 'react';
import { View, Text, ScrollView, Image, StatusBar, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useSchoolTheme } from '../contexts/SchoolThemeContext';
import { useActiveChild } from '../contexts/ActiveChildContext';
import { Pressable3D } from '../components/ui';
import { LT } from '../constants/lightTheme';
import { PD, cardShadow, darkenHex } from '../constants/parentDesign';

const ROLE_CONFIG: Record<string, { label: string }> = {
  SUPER_ADMIN: { label: 'Super Administrator' },
  ADMIN: { label: 'School Admin' },
  PRINCIPAL: { label: 'Principal' },
  TEACHER: { label: 'Teacher' },
  PARENT: { label: 'Parent' },
  BUS_HELPER: { label: 'Bus Helper' },
  OFFICE_STAFF: { label: 'Office Staff' },
  STUDENT: { label: 'Student' },
};

const ProfileScreen: React.FC = () => {
  const { userData, schoolData, logout } = useAuth();
  const { theme } = useSchoolTheme();
  const navigation = useNavigation<any>();
  const { children, activeChild, setActiveChild } = useActiveChild();
  const user = userData;

  const getInitials = (name: string) =>
    name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) ?? '?';

  const handleLogout = () => {
    navigation.getParent?.()?.closeDrawer?.();
    logout();
  };

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: LT.bg }} edges={['top']}>
        <StatusBar barStyle="dark-content" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
          <Text style={{ color: LT.textMuted, fontSize: 16, textAlign: 'center' }}>Not signed in</Text>
        </View>
      </SafeAreaView>
    );
  }

  const roleConfig = ROLE_CONFIG[user.role] ?? { label: user.role };
  const isParentRole = (user.role ?? '').toUpperCase() === 'PARENT';
  const primaryBranded = theme.primaryColor || '#2B5CE6';
  const primaryDarkBranded = darkenHex(primaryBranded, 0.2);

  if (isParentRole) {
    return (
      <View style={{ flex: 1, backgroundColor: PD.bg }}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={[primaryBranded, primaryDarkBranded]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingBottom: 32, minHeight: 200 }}>
          <SafeAreaView edges={['top']} style={{ alignItems: 'center', paddingHorizontal: 20 }}>
            <View
              style={[
                {
                  width: 88,
                  height: 88,
                  borderRadius: 44,
                  backgroundColor: '#FFFFFF',
                  alignItems: 'center',
                  justifyContent: 'center',
                },
                cardShadow,
              ]}
            >
              <Text style={{ color: primaryBranded, fontSize: 28, fontWeight: '900' }}>{getInitials(user.name)}</Text>
            </View>
            <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '900', marginTop: 12, textAlign: 'center' }}>{user.name}</Text>
            <View style={{ marginTop: 8, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 }}>
              <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>{roleConfig.label}</Text>
            </View>
            {schoolData?.name ? (
              <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, fontStyle: 'italic', marginTop: 8 }}>{schoolData.name}</Text>
            ) : null}
          </SafeAreaView>
        </LinearGradient>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48, marginTop: -20 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={[{ backgroundColor: PD.card, borderRadius: 20, padding: 20 }, cardShadow]}>
            <Text style={{ color: PD.textDark, fontWeight: '900', fontSize: 18, marginBottom: 12 }}>My Children</Text>
            {children.map((ch: any) => {
              const active = activeChild?.studentId === ch.studentId;
              return (
                <TouchableOpacity
                  key={ch.studentId}
                  onPress={() => setActiveChild(ch)}
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: PD.cardBorder }}
                >
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: primaryBranded, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#FFFFFF', fontWeight: '900' }}>{ch.name?.charAt(0) ?? 'C'}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ color: PD.textDark, fontWeight: '800', fontSize: 15 }}>{ch.name}</Text>
                    <Text style={{ color: PD.textMuted, fontSize: 11, marginTop: 2 }}>{ch.className}</Text>
                  </View>
                  {active ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: primaryBranded }} /> : null}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={[{ backgroundColor: PD.card, borderRadius: 20, padding: 20, marginTop: 16 }, cardShadow]}>
            <Text style={{ color: PD.textDark, fontWeight: '900', fontSize: 18, marginBottom: 12 }}>Account Details</Text>
            {[
              { icon: 'mail-outline' as const, val: user.email },
              { icon: 'call-outline' as const, val: (user as any).phone ?? 'Not set' },
              { icon: 'person-outline' as const, val: roleConfig.label },
            ].map((row, idx) => (
              <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: idx < 2 ? 1 : 0, borderBottomColor: PD.cardBorder }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: `${primaryBranded}18`, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={row.icon} size={18} color={primaryBranded} />
                </View>
                <Text style={{ color: PD.textDark, fontSize: 14, marginLeft: 12, flex: 1 }}>{row.val}</Text>
              </View>
            ))}
          </View>

          <View style={[{ backgroundColor: PD.card, borderRadius: 20, marginTop: 16, overflow: 'hidden' }, cardShadow]}>
            <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: PD.cardBorder }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: `${primaryBranded}18`, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="key-outline" size={18} color={primaryBranded} />
              </View>
              <Text style={{ color: PD.textDark, fontWeight: '800', flex: 1, marginLeft: 12 }}>Change Password</Text>
              <Ionicons name="chevron-forward" size={20} color={primaryBranded} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: `${primaryBranded}18`, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="cog-outline" size={18} color={primaryBranded} />
              </View>
              <Text style={{ color: PD.textDark, fontWeight: '800', flex: 1, marginLeft: 12 }}>Settings</Text>
              <Ionicons name="chevron-forward" size={20} color={primaryBranded} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleLogout}
            style={[{ backgroundColor: '#FEE2E2', borderRadius: 20, padding: 16, marginTop: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#FECACA' }, cardShadow]}
          >
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="logout" size={22} color="#EF4444" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ color: '#EF4444', fontWeight: '900', fontSize: 16 }}>Logout</Text>
              <Text style={{ color: '#EF444499', fontSize: 11, fontStyle: 'italic', marginTop: 2 }}>{userData?.email}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#EF4444" />
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: LT.bg }} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 }}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignItems: 'center', marginTop: 8 }}>
          {(user as any).avatarUrl ? (
            <Image source={{ uri: (user as any).avatarUrl }} style={{ width: 72, height: 72, borderRadius: 36 }} />
          ) : (
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: LT.primary,
                alignItems: 'center',
                justifyContent: 'center',
                ...LT.shadow,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '900' }}>{getInitials(user.name)}</Text>
            </View>
          )}
          <Text
            style={{
              color: LT.textPrimary,
              fontSize: 24,
              fontWeight: '900',
              marginTop: 16,
              textAlign: 'center',
              letterSpacing: -0.5,
            }}
          >
            {user.name}
          </Text>
          <View
            style={{
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 6,
              backgroundColor: LT.primary,
              marginTop: 8,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>{roleConfig.label}</Text>
          </View>
          {user.role !== 'SUPER_ADMIN' && schoolData?.name && (
            <Text style={{ color: LT.textMuted, fontSize: 14, marginTop: 8, textAlign: 'center', fontStyle: 'italic' }}>
              {schoolData.name}
            </Text>
          )}
        </View>

        <View
          style={{
            backgroundColor: LT.card,
            borderRadius: 20,
            padding: 20,
            marginTop: 32,
            borderWidth: 1,
            borderColor: LT.cardBorder,
            ...LT.shadow,
          }}
        >
          <Text style={{ color: LT.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 16 }}>Account Details</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: LT.primaryLight,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="mail-outline" size={18} color={LT.primary} />
            </View>
            <Text style={{ color: LT.textPrimary, fontSize: 14, flex: 1, marginLeft: 12 }}>{user.email}</Text>
          </View>
          <View style={{ height: 1, backgroundColor: LT.cardBorder }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }}>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: LT.primaryLight,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="call-outline" size={16} color={LT.primary} />
            </View>
            <Text
              style={{
                color: (user as any).phone ? LT.textPrimary : LT.textMuted,
                fontSize: 14,
                flex: 1,
                marginLeft: 12,
                fontStyle: (user as any).phone ? 'normal' : 'italic',
              }}
            >
              {(user as any).phone ?? 'Not set'}
            </Text>
          </View>
          <View style={{ height: 1, backgroundColor: LT.cardBorder }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: LT.primaryLight,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="person-outline" size={18} color={LT.primary} />
            </View>
            <Text style={{ color: LT.textPrimary, fontSize: 14, flex: 1, marginLeft: 12 }}>{roleConfig.label}</Text>
          </View>
        </View>

        {user.role !== 'SUPER_ADMIN' && (
          <View
            style={{
              backgroundColor: LT.card,
              borderRadius: 20,
              padding: 20,
              marginTop: 12,
              borderWidth: 1,
              borderColor: LT.cardBorder,
              ...LT.shadow,
            }}
          >
            <Text style={{ color: LT.textPrimary, fontSize: 18, fontWeight: '900', marginBottom: 16 }}>School</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: LT.primaryLight,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="school-outline" size={16} color={LT.primary} />
              </View>
              <Text style={{ color: LT.textPrimary, fontSize: 14, flex: 1, marginLeft: 12 }}>{schoolData?.name ?? '—'}</Text>
            </View>
            <View style={{ height: 1, backgroundColor: LT.cardBorder }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: LT.primaryLight,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="key-outline" size={18} color={LT.primary} />
              </View>
              <Text style={{ color: LT.primary, fontSize: 14, fontVariant: ['tabular-nums'], flex: 1, marginLeft: 12 }}>
                {(theme as any).schoolCode ?? '—'}
              </Text>
            </View>
          </View>
        )}

        <Pressable3D onPress={() => navigation.navigate('Settings')} style={{ marginTop: 12 }}>
          <View
            style={{
              backgroundColor: LT.card,
              borderRadius: 20,
              padding: 20,
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: LT.cardBorder,
              ...LT.shadow,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: LT.primaryLight,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="key-outline" size={20} color={LT.primary} />
            </View>
            <Text style={{ color: LT.textPrimary, fontSize: 16, fontWeight: '700', flex: 1, marginLeft: 12 }}>Change Password</Text>
            <Ionicons name="chevron-forward" size={20} color={LT.primary} />
          </View>
        </Pressable3D>

        <Pressable3D onPress={handleLogout} style={{ marginTop: 8 }}>
          <View
            style={{
              backgroundColor: '#FEE2E2',
              borderRadius: 20,
              padding: 20,
              borderWidth: 1,
              borderColor: '#FECACA',
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: '#FEE2E2',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 14,
              }}
            >
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: LT.danger, fontSize: 16, fontWeight: '700' }}>Logout</Text>
              <Text style={{ color: LT.textMuted, fontSize: 12, marginTop: 2, fontStyle: 'italic' }}>{userData?.email}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={LT.danger} />
          </View>
        </Pressable3D>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
