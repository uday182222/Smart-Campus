// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  ScrollView,
  Pressable,
  Icon,
  Avatar,
  Badge,
  Divider,
  Spinner,
} from 'native-base';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RefreshControl } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function ProductionTeacherDashboardV2({ navigation }: any) {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    present: 28,
    absent: 2,
    homework: 5,
    exams: 2,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    // Refresh data here
    setTimeout(() => setRefreshing(false), 1000);
  };

  const QuickAction = ({ icon, title, color, onPress, count }: any) => (
    <Pressable onPress={onPress} flex={1}>
      {({ isPressed }) => (
        <Box
          bg="white"
          rounded="2xl"
          p={4}
          shadow={3}
          style={{ transform: [{ scale: isPressed ? 0.95 : 1 }] }}
        >
          <VStack space={2} alignItems="center">
            <Box bg={`${color}.100`} rounded="full" p={3}>
              <Icon as={MaterialIcons} name={icon} size="xl" color={`${color}.600`} />
            </Box>
            <Text fontSize="sm" fontWeight="600" textAlign="center">
              {title}
            </Text>
            {count !== undefined && (
              <Badge colorScheme={color} rounded="full">
                {count}
              </Badge>
            )}
          </VStack>
        </Box>
      )}
    </Pressable>
  );

  const StatCard = ({ icon, label, value, color }: any) => (
    <Box bg="white" rounded="xl" p={4} shadow={2} flex={1}>
      <HStack space={3} alignItems="center">
        <Box bg={`${color}.100`} rounded="lg" p={2}>
          <Icon as={FontAwesome5} name={icon} size="md" color={`${color}.600`} />
        </Box>
        <VStack flex={1}>
          <Text fontSize="xs" color="gray.500">
            {label}
          </Text>
          <Heading size="md" color="gray.800">
            {value}
          </Heading>
        </VStack>
      </HStack>
    </Box>
  );

  return (
    <Box flex={1} bg="gray.50">
      {/* Header with Gradient */}
      <Box>
        <LinearGradient
          colors={['#2196F3', '#1976D2']}
          style={{ paddingTop: 60, paddingBottom: 30, paddingHorizontal: 20 }}
        >
          <HStack alignItems="center" justifyContent="space-between">
            <HStack space={3} alignItems="center">
              <Avatar
                size="md"
                source={{ uri: userData?.profilePicture || 'https://via.placeholder.com/150' }}
                bg="white"
              >
                {userData?.name?.charAt(0) || 'T'}
              </Avatar>
              <VStack>
                <Text color="white" fontSize="sm" opacity={0.9}>
                  Welcome back,
                </Text>
                <Heading color="white" size="md">
                  {userData?.name || 'Teacher'}
                </Heading>
              </VStack>
            </HStack>
            <Pressable onPress={() => navigation.navigate('Notifications')}>
              <Box position="relative">
                <Icon as={MaterialIcons} name="notifications" size="lg" color="white" />
                <Badge
                  colorScheme="red"
                  rounded="full"
                  position="absolute"
                  top={-5}
                  right={-5}
                  size="sm"
                >
                  3
                </Badge>
              </Box>
            </Pressable>
          </HStack>
        </LinearGradient>
      </Box>

      <ScrollView
        px={4}
        mt={-4}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Today's Stats */}
        <VStack space={3} mb={4}>
          <Heading size="sm" color="gray.700">
            Today's Overview
          </Heading>
          <HStack space={3}>
            <StatCard icon="user-check" label="Present" value={stats.present} color="green" />
            <StatCard icon="user-times" label="Absent" value={stats.absent} color="red" />
          </HStack>
          <HStack space={3}>
            <StatCard icon="clipboard-list" label="Homework" value={stats.homework} color="orange" />
            <StatCard icon="calendar-check" label="Exams" value={stats.exams} color="purple" />
          </HStack>
        </VStack>

        {/* Quick Actions */}
        <VStack space={3} mb={4}>
          <Heading size="sm" color="gray.700">
            Quick Actions
          </Heading>
          <HStack space={3}>
            <QuickAction
              icon="how-to-reg"
              title="Mark Attendance"
              color="blue"
              onPress={() => navigation.navigate('Attendance')}
            />
            <QuickAction
              icon="book"
              title="Add Homework"
              color="green"
              onPress={() => navigation.navigate('Homework')}
            />
          </HStack>
          <HStack space={3}>
            <QuickAction
              icon="assignment"
              title="Enter Marks"
              color="orange"
              onPress={() => navigation.navigate('Marks')}
            />
            <QuickAction
              icon="schedule"
              title="Timetable"
              color="purple"
              onPress={() => navigation.navigate('Timetable')}
            />
          </HStack>
        </VStack>

        {/* Recent Activity */}
        <VStack space={3} mb={6}>
          <Heading size="sm" color="gray.700">
            Recent Activity
          </Heading>
          <Box bg="white" rounded="xl" p={4} shadow={2}>
            <VStack space={3}>
              <HStack space={3} alignItems="center">
                <Box bg="blue.100" rounded="full" p={2}>
                  <Icon as={MaterialIcons} name="check-circle" size="sm" color="blue.600" />
                </Box>
                <VStack flex={1}>
                  <Text fontSize="sm" fontWeight="600">
                    Attendance marked for Class 10-A
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    2 hours ago
                  </Text>
                </VStack>
              </HStack>
              
              <Divider />
              
              <HStack space={3} alignItems="center">
                <Box bg="green.100" rounded="full" p={2}>
                  <Icon as={MaterialIcons} name="assignment" size="sm" color="green.600" />
                </Box>
                <VStack flex={1}>
                  <Text fontSize="sm" fontWeight="600">
                    Homework assigned: Math Chapter 5
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    Yesterday
                  </Text>
                </VStack>
              </HStack>

              <Divider />
              
              <HStack space={3} alignItems="center">
                <Box bg="orange.100" rounded="full" p={2}>
                  <Icon as={MaterialIcons} name="grade" size="sm" color="orange.600" />
                </Box>
                <VStack flex={1}>
                  <Text fontSize="sm" fontWeight="600">
                    Marks entered for Unit Test
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    2 days ago
                  </Text>
                </VStack>
              </HStack>
            </VStack>
          </Box>
        </VStack>

        {/* My Classes */}
        <VStack space={3} mb={6}>
          <HStack justifyContent="space-between" alignItems="center">
            <Heading size="sm" color="gray.700">
              My Classes
            </Heading>
            <Pressable onPress={() => navigation.navigate('Classes')}>
              <Text color="primary.500" fontSize="sm">View All</Text>
            </Pressable>
          </HStack>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <HStack space={3}>
              {['10-A', '10-B', '9-A', '9-B'].map((className, index) => (
                <Pressable key={index} onPress={() => navigation.navigate('ClassDetail', { className })}>
                  <Box bg="white" rounded="xl" p={4} shadow={2} w={120}>
                    <VStack space={2} alignItems="center">
                      <Box bg={['blue', 'green', 'purple', 'orange'][index] + '.100'} rounded="full" p={3}>
                        <Icon as={MaterialIcons} name="class" size="lg" color={['blue', 'green', 'purple', 'orange'][index] + '.600'} />
                      </Box>
                      <Text fontWeight="600">Class {className}</Text>
                      <Text fontSize="xs" color="gray.500">30 students</Text>
                    </VStack>
                  </Box>
                </Pressable>
              ))}
            </HStack>
          </ScrollView>
        </VStack>
      </ScrollView>
    </Box>
  );
}

