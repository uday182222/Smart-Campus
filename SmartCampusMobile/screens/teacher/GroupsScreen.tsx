/**
 * Teacher — Custom groups: list, create, detail, group messaging.
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Plus, Users, Trash2, UserPlus } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useSchoolTheme } from '../../contexts/SchoolThemeContext';
import { LightButton, LightInput } from '../../components/ui';
import { T } from '../../constants/theme';
import { apiClient } from '../../services/apiClient';
import { ClassService } from '../../services/ClassService';
import { TeacherFloatingNav } from '../../components/ui/TeacherFloatingNav';

const API = apiClient as any;

interface GroupItem {
  id: string;
  name: string;
  description?: string | null;
  memberCount: number;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
}

interface GroupMember {
  id: string;
  name: string;
  photo?: string | null;
}

interface StudentOption {
  id: string;
  name: string;
  className?: string;
}

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

export default function GroupsScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { theme } = useSchoolTheme();
  const primary = theme.primaryColor || T.primary;

  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupItem | null>(null);
  const [groupDetail, setGroupDetail] = useState<{ members: GroupMember[] } | null>(null);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupMessage, setGroupMessage] = useState('');
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [addMembersOpen, setAddMembersOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');

  const loadGroups = useCallback(async () => {
    try {
      const res = await API.get('/groups');
      const data = (res as any)?.data ?? res;
      const list = Array.isArray(data) ? data : data?.data ?? [];
      setGroups(Array.isArray(list) ? list : []);
    } catch (_e) {
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStudents = useCallback(async () => {
    try {
      const res = await API.get('/teacher/students-for-messaging');
      const data = (res as any)?.data ?? res;
      const list = Array.isArray(data) ? data : data?.data ?? [];
      setStudents(
        (Array.isArray(list) ? list : []).map((s: any) => ({
          id: s.id ?? s.userId,
          name: s.name,
          className: s.className,
        }))
      );
    } catch (_e) {
      const classesRes = await ClassService.getTeacherClasses();
      const allStudents: StudentOption[] = [];
      for (const cls of classesRes.data ?? []) {
        const stRes = await ClassService.getTeacherClassStudents(cls.id);
        for (const st of stRes.data ?? []) {
          allStudents.push({
            id: st.id,
            name: st.name,
            className: `${cls.name || ''} ${cls.section || ''}`.trim(),
          });
        }
      }
      setStudents(allStudents);
    }
  }, []);

  useEffect(() => {
    loadGroups();
    loadStudents();
  }, [loadGroups, loadStudents]);

  const openGroupDetail = async (group: GroupItem) => {
    setSelectedGroup(group);
    setGroupMessage('');
    setDetailOpen(true);
    try {
      const res = await API.get(`/groups/${group.id}`);
      const data = (res as any)?.data ?? res;
      setGroupDetail({ members: data?.members ?? data?.data?.members ?? [] });
    } catch (_e) {
      setGroupDetail({ members: [] });
    }
  };

  const toggleMember = (id: string) => {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const createGroup = async () => {
    if (!groupName.trim() || selectedMemberIds.size === 0) {
      Alert.alert('Missing info', 'Enter a group name and select at least one member.');
      return;
    }
    setSaving(true);
    try {
      await API.post('/groups', {
        name: groupName.trim(),
        description: groupDescription.trim() || undefined,
        memberIds: Array.from(selectedMemberIds),
      });
      setCreateOpen(false);
      setGroupName('');
      setGroupDescription('');
      setSelectedMemberIds(new Set());
      loadGroups();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to create group.');
    } finally {
      setSaving(false);
    }
  };

  const sendGroupMessage = async () => {
    if (!selectedGroup || !groupMessage.trim()) return;
    setSaving(true);
    try {
      await API.post(`/groups/${selectedGroup.id}/message`, { content: groupMessage.trim() });
      setGroupMessage('');
      Alert.alert('Sent', 'Message sent to all group members.');
      loadGroups();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to send message.');
    } finally {
      setSaving(false);
    }
  };

  const addMembers = async () => {
    if (!selectedGroup || selectedMemberIds.size === 0) return;
    setSaving(true);
    try {
      await API.post(`/groups/${selectedGroup.id}/members`, {
        memberIds: Array.from(selectedMemberIds),
      });
      setAddMembersOpen(false);
      setSelectedMemberIds(new Set());
      openGroupDetail(selectedGroup);
      loadGroups();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to add members.');
    } finally {
      setSaving(false);
    }
  };

  const deleteGroup = () => {
    if (!selectedGroup) return;
    Alert.alert('Delete Group', `Delete "${selectedGroup.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await API.delete(`/groups/${selectedGroup.id}`);
            setDetailOpen(false);
            setSelectedGroup(null);
            loadGroups();
          } catch (e: any) {
            Alert.alert('Error', e?.message ?? 'Failed to delete group.');
          }
        },
      },
    ]);
  };

  const filteredStudents = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        String(s.className ?? '')
          .toLowerCase()
          .includes(q)
    );
  }, [students, memberSearch]);

  const renderMemberPicker = (forAdd = false) => (
    <>
      <View
        style={{
          marginTop: 12,
          borderWidth: 1,
          borderColor: T.inputBorder,
          borderRadius: 14,
          paddingHorizontal: 12,
          height: 46,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <TextInput
          placeholder="Search students..."
          placeholderTextColor={T.textMuted}
          value={memberSearch}
          onChangeText={setMemberSearch}
          style={{ flex: 1, color: T.textDark, fontSize: 14 }}
        />
      </View>
      <ScrollView style={{ maxHeight: 280, marginTop: 12 }}>
        {filteredStudents.map((student) => {
          const checked = selectedMemberIds.has(student.id);
          return (
            <TouchableOpacity
              key={student.id}
              onPress={() => toggleMember(student.id)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                borderBottomWidth: 0.5,
                borderBottomColor: T.inputBorder,
              }}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  borderWidth: 2,
                  borderColor: checked ? primary : T.inputBorder,
                  backgroundColor: checked ? primary : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                {checked ? <Text style={{ color: T.textWhite, fontWeight: '900', fontSize: 12 }}>✓</Text> : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: T.textDark, fontWeight: '800', fontSize: 14 }}>{student.name}</Text>
                <Text style={{ color: T.textMuted, fontSize: 12, marginTop: 2 }}>{student.className ?? '—'}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <LightButton
        label={forAdd ? 'Add Members' : 'Create Group'}
        onPress={forAdd ? addMembers : createGroup}
        variant="primary"
        style={{ marginTop: 16, backgroundColor: primary } as any}
        loading={saving}
      />
    </>
  );

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: T.px, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: T.card,
              alignItems: 'center',
              justifyContent: 'center',
              ...T.shadowSm,
            }}
          >
            <ChevronLeft size={20} color={T.textDark} strokeWidth={1.8} />
          </TouchableOpacity>
          <Text style={{ ...T.font.appTitle, color: T.textDark, flex: 1, textAlign: 'center' }}>Groups</Text>
          <View style={{ width: 44 }} />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: T.px, paddingBottom: 120 }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: 48 }}>
              <Users size={40} color={T.textMuted} strokeWidth={1.5} />
              <Text style={{ color: T.textDark, fontWeight: '800', fontSize: 18, marginTop: 12 }}>No groups yet</Text>
              <Text style={{ color: T.textMuted, fontSize: 14, marginTop: 6, textAlign: 'center' }}>
                Create a group to message multiple students at once.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => openGroupDetail(item)}
              activeOpacity={0.85}
              style={{
                backgroundColor: T.card,
                borderRadius: T.radius.xxl,
                padding: 18,
                marginBottom: 12,
                ...T.shadowSm,
              }}
            >
              <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 16 }}>{item.name}</Text>
              <Text style={{ color: T.textMuted, fontSize: 13, marginTop: 6 }}>
                {item.memberCount} member{item.memberCount === 1 ? '' : 's'}
              </Text>
              {item.lastMessage ? (
                <Text style={{ color: T.textMuted, fontSize: 12, marginTop: 8, fontStyle: 'italic' }} numberOfLines={1}>
                  {item.lastMessage}
                </Text>
              ) : null}
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity
        onPress={() => {
          setSelectedMemberIds(new Set());
          setGroupName('');
          setGroupDescription('');
          setMemberSearch('');
          setCreateOpen(true);
        }}
        style={{
          position: 'absolute',
          right: T.px,
          bottom: 100,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: primary,
          alignItems: 'center',
          justifyContent: 'center',
          ...T.shadowMd,
        }}
      >
        <Plus size={28} color={T.textWhite} strokeWidth={2} />
      </TouchableOpacity>

      <Modal visible={createOpen} transparent animationType="slide" onRequestClose={() => setCreateOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' }} onPress={() => setCreateOpen(false)} />
        <View style={{ backgroundColor: T.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' }}>
          <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 18 }}>Create Group</Text>
          <LightInput label="Group Name" placeholder="e.g. Science Club" value={groupName} onChangeText={setGroupName} />
          <LightInput
            label="Description (optional)"
            placeholder="What is this group for?"
            value={groupDescription}
            onChangeText={setGroupDescription}
          />
          <Text style={{ color: T.textDark, fontWeight: '800', fontSize: 14, marginTop: 8 }}>Select Members</Text>
          {renderMemberPicker(false)}
        </View>
      </Modal>

      <Modal visible={detailOpen} transparent animationType="slide" onRequestClose={() => setDetailOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' }} onPress={() => setDetailOpen(false)} />
        <View style={{ backgroundColor: T.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '90%' }}>
          <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 18 }}>{selectedGroup?.name}</Text>
          <Text style={{ color: T.textMuted, fontSize: 13, marginTop: 4 }}>
            {groupDetail?.members.length ?? selectedGroup?.memberCount ?? 0} members
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 16 }}>
            {(groupDetail?.members ?? []).map((m) => (
              <View key={m.id} style={{ alignItems: 'center', marginRight: 14 }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: T.textWhite, fontWeight: '900', fontSize: 14 }}>{getInitials(m.name)}</Text>
                </View>
                <Text style={{ color: T.textMuted, fontSize: 11, marginTop: 6, maxWidth: 64 }} numberOfLines={1}>
                  {m.name}
                </Text>
              </View>
            ))}
          </ScrollView>

          <LightInput
            label="Message"
            placeholder="Type a message for the group..."
            value={groupMessage}
            onChangeText={setGroupMessage}
            multiline
            style={{ minHeight: 80, textAlignVertical: 'top' } as any}
          />
          <LightButton
            label="Send Message to Group"
            onPress={sendGroupMessage}
            variant="primary"
            style={{ marginTop: 8, backgroundColor: primary } as any}
            loading={saving}
          />

          <TouchableOpacity
            onPress={() => {
              setSelectedMemberIds(new Set());
              setMemberSearch('');
              setAddMembersOpen(true);
            }}
            style={{
              marginTop: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 12,
              borderRadius: T.radius.full,
              borderWidth: 1,
              borderColor: T.inputBorder,
            }}
          >
            <UserPlus size={18} color={primary} strokeWidth={1.8} />
            <Text style={{ color: primary, fontWeight: '800', marginLeft: 8 }}>Add Members</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={deleteGroup}
            style={{
              marginTop: 10,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 12,
              borderRadius: T.radius.full,
              backgroundColor: T.dangerTint,
              borderWidth: 1,
              borderColor: 'rgba(239,68,68,0.25)',
            }}
          >
            <Trash2 size={18} color={T.danger} strokeWidth={1.8} />
            <Text style={{ color: T.danger, fontWeight: '800', marginLeft: 8 }}>Delete Group</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal visible={addMembersOpen} transparent animationType="slide" onRequestClose={() => setAddMembersOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' }} onPress={() => setAddMembersOpen(false)} />
        <View style={{ backgroundColor: T.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' }}>
          <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 18 }}>Add Members</Text>
          {renderMemberPicker(true)}
        </View>
      </Modal>

      <TeacherFloatingNav navigation={navigation} activeTab="TeacherMore" />
    </View>
  );
}
