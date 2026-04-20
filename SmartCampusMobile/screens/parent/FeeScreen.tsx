/**
 * Smart Campus - Fees (NativeWind)
 * AppHeader, summary GradientCard (Total Due, Pay Now), Fee Structure list, Payment History.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { AppHeader } from '../../components/ui';
import apiClient from '../../services/apiClient';
import ParentService from '../../services/ParentService';

export default function FeeScreen({ navigation }: { navigation: any }) {
  const { userData } = useAuth();
  const [studentId, setStudentId] = useState<string | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [structures, setStructures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const schoolId = (userData as any)?.schoolId ?? '';

  useEffect(() => {
    ParentService.getChildren()
      .then((r) => {
        if (r.success && r.data?.children?.length) setStudentId(r.data.children[0].id);
      })
      .catch(() => {});
  }, []);

  const load = async () => {
    if (!studentId) return;
    try {
      setLoading(true);
      const [payRes, structRes] = await Promise.all([
        apiClient.get<{ data?: { payments?: any[] } }>(`/fees/student/${studentId}`),
        schoolId ? apiClient.get<{ data?: { feeStructures?: any[] } }>(`/fees/${schoolId}`) : Promise.resolve({ data: {} }),
      ]);
      setPayments((payRes as any).data?.payments ?? []);
      setStructures((structRes as any).data?.feeStructures ?? []);
    } catch (e) {
      setPayments([]);
      setStructures([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [schoolId, studentId]);

  const payForStructure = (fee: any) => {
    const amount = Number(fee.amount) || 0;
    Alert.alert('Pay Fee', `Pay ${amount} ${fee.currency || 'INR'} for ${fee.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Pay',
        onPress: async () => {
          try {
            await apiClient.post('/fees/payment', {
              feeStructureId: fee.id,
              studentId,
              amountPaid: amount,
              paymentMethod: 'card',
            });
            Alert.alert('Success', 'Payment recorded.');
            load();
          } catch (err: any) {
            Alert.alert('Error', err?.message || 'Payment failed.');
          }
        },
      },
    ]);
  };

  const paidIds = new Set(payments.map((p: any) => p.feeStructureId));
  const totalDue = structures
    .filter((f: any) => !paidIds.has(f.id))
    .reduce((sum: number, f: any) => sum + (Number(f.amount) || 0), 0);
  const lastPayment = payments[0];

  if (!studentId && !loading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <AppHeader title="Fees" showBack onBackPress={() => navigation.goBack()} />
        <View className="flex-1 items-center justify-center px-5">
          <Text className="text-muted text-center">No linked student. Contact school.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle="dark-content" />
      <AppHeader title="Fees" showBack onBackPress={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        <TouchableOpacity activeOpacity={0.92} className="mt-4">
          <LinearGradient
            colors={totalDue > 0 ? (['#FEF3C7', '#FDE68A', '#FCD34D'] as unknown as readonly [string, string, ...string[]]) : (['#D1FAE5', '#A7F3D0', '#6EE7B7'] as unknown as readonly [string, string, ...string[]])}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-3xl p-5"
            style={{ minHeight: 140 }}
          >
            <Text className="text-muted text-sm">Total Due</Text>
            <Text className={`text-3xl font-extrabold mt-1 ${totalDue > 0 ? 'text-amber-800' : 'text-dark'}`}>
              {totalDue > 0 ? `₹${totalDue}` : 'All clear'}
            </Text>
            {lastPayment?.paidAt && (
              <Text className="text-muted text-xs mt-2">Last payment: {new Date(lastPayment.paidAt).toLocaleDateString()}</Text>
            )}
            {totalDue > 0 && (
              <TouchableOpacity
                className="bg-dark rounded-xl py-2.5 px-4 self-start mt-3"
                onPress={() => structures.find((f: any) => !paidIds.has(f.id)) && payForStructure(structures.find((f: any) => !paidIds.has(f.id)))}
              >
                <Text className="text-white font-bold">Pay Now</Text>
              </TouchableOpacity>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <Text className="text-xl font-bold text-dark mt-8 mb-3">Fee Structure</Text>
        {structures.length === 0 && !loading ? (
          <Text className="text-muted">No fee structures.</Text>
        ) : (
          structures.map((f: any) => {
            const paid = paidIds.has(f.id);
            const overdue = f.dueDate && new Date(f.dueDate) < new Date() && !paid;
            return (
              <View
                key={f.id}
                className="bg-white rounded-2xl p-4 mb-3"
                style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 }}
              >
                <View className="flex-row justify-between items-start">
                  <Text className="text-base font-bold text-dark flex-1">{f.name}</Text>
                  <Text className="text-primary font-bold">{f.amount} {f.currency || 'INR'}</Text>
                </View>
                {f.dueDate && (
                  <View className="flex-row items-center mt-2">
                    <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                    <Text className="text-muted text-sm ml-1.5">Due: {new Date(f.dueDate).toLocaleDateString()}</Text>
                  </View>
                )}
                <View className="mt-3">
                  {paid ? (
                    <View className="flex-row items-center">
                      <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                      <Text className="text-success font-semibold text-sm ml-2">PAID</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      className="flex-row items-center justify-center bg-primary rounded-xl py-2"
                      onPress={() => payForStructure(f)}
                    >
                      <Ionicons name="card-outline" size={18} color="#fff" />
                      <Text className="text-white font-semibold text-sm ml-2">Pay</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {overdue && !paid && (
                  <View className="absolute top-3 right-3 rounded-lg px-2 py-0.5 bg-danger">
                    <Text className="text-white text-xs font-medium">OVERDUE</Text>
                  </View>
                )}
              </View>
            );
          })
        )}

        <Text className="text-xl font-bold text-dark mt-8 mb-3">Payment History</Text>
        {payments.length === 0 ? (
          <Text className="text-muted">No payments yet.</Text>
        ) : (
          payments.map((p: any) => (
            <View
              key={p.id}
              className="bg-white rounded-2xl p-4 mb-3 flex-row items-center"
              style={{ elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 }}
            >
              <View className="w-10 h-10 rounded-xl bg-green-100 items-center justify-center mr-3">
                <Ionicons name="checkmark-done" size={20} color="#10B981" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-dark">{p.feeStructure?.name ?? 'Fee'}</Text>
                <Text className="text-muted text-sm">{p.amountPaid} — {new Date(p.paidAt).toLocaleDateString()}</Text>
              </View>
              <TouchableOpacity className="p-2">
                <Ionicons name="receipt-outline" size={20} color="#1E40AF" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
