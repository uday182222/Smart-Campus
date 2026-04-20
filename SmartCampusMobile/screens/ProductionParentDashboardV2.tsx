import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  ScrollView,
  Avatar,
  Icon,
  Progress,
  Pressable,
  Badge,
  Select,
  Spinner,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RefreshControl } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function ProductionParentDashboardV2({ navigation }: any) {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedChild, setSelectedChild] = useState('0');
  
  const children = [
    { id: '0', name: 'John Doe', class: '10-A', roll: '15', avatar: 'JD' },
    { id: '1', name: 'Jane Doe', class: '7-B', roll: '8', avatar: 'JN' },
  ];

  const currentChild = children[parseInt(selectedChild)] || children[0];

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const InfoCard = ({ title, value, icon, color, onPress }: any) => (
    <Pressable onPress={onPress} flex={1}>
      {({ isPressed }) => (
        <Box
          bg="white"
          rounded="xl"
          p={4}
          shadow={2}
          style={{ transform: [{ scale: isPressed ? 0.97 : 1 }] }}
        >
          <HStack space={2} alignItems="center" mb={2}>
            <Box bg={`${color}.100`} rounded="lg" p={1.5}>
              <Icon as={MaterialIcons} name={icon} size="sm" color={`${color}.600`} />
            </Box>
            <Text fontSize="xs" color="gray.500" flex={1}>
              {title}
            </Text>
          </HStack>
          <Heading size="lg" color="gray.800">
            {value}
          </Heading>
        </Box>
      )}
    </Pressable>
  );

  return (
    <Box flex={1} bg="gray.50">
      {/* Header */}
      <Box>
        <LinearGradient
          colors={['#4CAF50', '#388E3C']}
          style={{ paddingTop: 60, paddingBottom: 30, paddingHorizontal: 20 }}
        >
          <VStack space={4}>
            <HStack alignItems="center" justifyContent="space-between">
              <Heading color="white" size="lg">
                My Children
              </Heading>
              <HStack space={3}>
                <Pressable onPress={() => navigation.navigate('Notifications')}>
                  <Box position="relative">
                    <Icon as={MaterialIcons} name="notifications" size="md" color="white" />
                    <Badge colorScheme="red" rounded="full" position="absolute" top={-5} right={-5} size="sm">
                      2
                    </Badge>
                  </Box>
                </Pressable>
                <Pressable onPress={() => navigation.navigate('Settings')}>
                  <Icon as={MaterialIcons} name="settings" size="md" color="white" />
                </Pressable>
              </HStack>
            </HStack>

            {/* Child Selector */}
            <Box bg="rgba(255,255,255,0.2)" rounded="xl" p={1}>
              <Select
                selectedValue={selectedChild}
                onValueChange={setSelectedChild}
                bg="transparent"
                borderWidth={0}
                color="white"
                fontSize="md"
                _selectedItem={{
                  bg: "green.100",
                }}
              >
                {children.map((child) => (
                  <Select.Item
                    key={child.id}
                    label={`${child.name} - Class ${child.class}`}
                    value={child.id}
                  />
                ))}
              </Select>
            </Box>

            {/* Selected Child Info */}
            <HStack space={3} alignItems="center" bg="rgba(255,255,255,0.2)" rounded="xl" p={3}>
              <Avatar size="md" bg="white">
                <Text color="green.600" fontWeight="bold">{currentChild.avatar}</Text>
              </Avatar>
              <VStack flex={1}>
                <Text color="white" fontWeight="bold" fontSize="lg">
                  {currentChild.name}
                </Text>
                <Text color="white" fontSize="sm" opacity={0.9}>
                  Class {currentChild.class} • Roll No. {currentChild.roll}
                </Text>
              </VStack>
            </HStack>
          </VStack>
        </LinearGradient>
      </Box>

      <ScrollView
        px={4}
        mt={-2}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Quick Stats */}
        <HStack space={3} mb={4}>
          <InfoCard
            title="Attendance"
            value="95%"
            icon="event-available"
            color="blue"
            onPress={() => navigation.navigate('Attendance')}
          />
          <InfoCard
            title="Homework"
            value="3/5"
            icon="assignment"
            color="orange"
            onPress={() => navigation.navigate('Homework')}
          />
        </HStack>

        {/* Attendance Progress */}
        <Box bg="white" rounded="xl" p={4} shadow={2} mb={4}>
          <HStack alignItems="center" justifyContent="space-between" mb={3}>
            <Heading size="sm" color="gray.700">
              Monthly Attendance
            </Heading>
            <Badge colorScheme="success" rounded="full">
              Excellent
            </Badge>
          </HStack>
          <Progress value={95} colorScheme="green" size="md" rounded="full" />
          <HStack justifyContent="space-between" mt={2}>
            <Text fontSize="xs" color="gray.500">
              19/20 days present
            </Text>
            <Text fontSize="xs" color="green.600" fontWeight="600">
              95%
            </Text>
          </HStack>
        </Box>

        {/* Academic Performance */}
        <Box bg="white" rounded="xl" p={4} shadow={2} mb={4}>
          <HStack alignItems="center" justifyContent="space-between" mb={3}>
            <Heading size="sm" color="gray.700">
              Academic Performance
            </Heading>
            <Badge colorScheme="blue" rounded="full">
              Grade A
            </Badge>
          </HStack>
          <HStack space={4}>
            <VStack flex={1} alignItems="center">
              <Text fontSize="2xl" fontWeight="bold" color="blue.600">85%</Text>
              <Text fontSize="xs" color="gray.500">Average</Text>
            </VStack>
            <VStack flex={1} alignItems="center">
              <Text fontSize="2xl" fontWeight="bold" color="green.600">92%</Text>
              <Text fontSize="xs" color="gray.500">Best Score</Text>
            </VStack>
            <VStack flex={1} alignItems="center">
              <Text fontSize="2xl" fontWeight="bold" color="purple.600">5</Text>
              <Text fontSize="xs" color="gray.500">Tests Taken</Text>
            </VStack>
          </HStack>
        </Box>

        {/* Recent Updates */}
        <VStack space={3} mb={4}>
          <Heading size="sm" color="gray.700">
            Recent Updates
          </Heading>

          {/* Homework Card */}
          <Box bg="white" rounded="xl" p={4} shadow={2}>
            <HStack space={3} alignItems="flex-start">
              <Box bg="orange.100" rounded="lg" p={2}>
                <Icon as={MaterialIcons} name="assignment" size="md" color="orange.600" />
              </Box>
              <VStack flex={1} space={1}>
                <Text fontWeight="600" color="gray.800">
                  New Homework Assigned
                </Text>
                <Text fontSize="sm" color="gray.600">
                  Mathematics - Chapter 5 Exercises
                </Text>
                <HStack space={2} mt={1}>
                  <Badge colorScheme="orange" rounded="md">
                    Due: Tomorrow
                  </Badge>
                  <Badge colorScheme="gray" variant="subtle" rounded="md">
                    Pending
                  </Badge>
                </HStack>
              </VStack>
            </HStack>
          </Box>

          {/* Exam Card */}
          <Box bg="white" rounded="xl" p={4} shadow={2}>
            <HStack space={3} alignItems="flex-start">
              <Box bg="purple.100" rounded="lg" p={2}>
                <Icon as={MaterialIcons} name="assessment" size="md" color="purple.600" />
              </Box>
              <VStack flex={1} space={1}>
                <Text fontWeight="600" color="gray.800">
                  Unit Test Results
                </Text>
                <Text fontSize="sm" color="gray.600">
                  Science Unit Test - Scored 85/100
                </Text>
                <Badge colorScheme="success" alignSelf="flex-start" rounded="md" mt={1}>
                  Grade: A
                </Badge>
              </VStack>
            </HStack>
          </Box>

          {/* Attendance Alert */}
          <Box bg="white" rounded="xl" p={4} shadow={2}>
            <HStack space={3} alignItems="flex-start">
              <Box bg="green.100" rounded="lg" p={2}>
                <Icon as={MaterialIcons} name="check-circle" size="md" color="green.600" />
              </Box>
              <VStack flex={1} space={1}>
                <Text fontWeight="600" color="gray.800">
                  Attendance Marked
                </Text>
                <Text fontSize="sm" color="gray.600">
                  {currentChild.name} is present today
                </Text>
                <Text fontSize="xs" color="gray.400" mt={1}>
                  Marked at 8:30 AM
                </Text>
              </VStack>
            </HStack>
          </Box>
        </VStack>

        {/* Action Buttons */}
        <HStack space={3} mb={6}>
          <Pressable flex={1} onPress={() => navigation.navigate('Transport')}>
            <Box bg="blue.500" rounded="xl" p={4} shadow={3}>
              <VStack space={2} alignItems="center">
                <Icon as={MaterialIcons} name="directions-bus" size="lg" color="white" />
                <Text color="white" fontWeight="600" fontSize="sm">
                  Track Bus
                </Text>
              </VStack>
            </Box>
          </Pressable>
          <Pressable flex={1} onPress={() => navigation.navigate('Fees')}>
            <Box bg="green.500" rounded="xl" p={4} shadow={3}>
              <VStack space={2} alignItems="center">
                <Icon as={MaterialIcons} name="payment" size="lg" color="white" />
                <Text color="white" fontWeight="600" fontSize="sm">
                  Pay Fees
                </Text>
              </VStack>
            </Box>
          </Pressable>
          <Pressable flex={1} onPress={() => navigation.navigate('Gallery')}>
            <Box bg="purple.500" rounded="xl" p={4} shadow={3}>
              <VStack space={2} alignItems="center">
                <Icon as={MaterialIcons} name="photo-library" size="lg" color="white" />
                <Text color="white" fontWeight="600" fontSize="sm">
                  Gallery
                </Text>
              </VStack>
            </Box>
          </Pressable>
        </HStack>

        {/* Upcoming Events */}
        <VStack space={3} mb={6}>
          <Heading size="sm" color="gray.700">
            Upcoming Events
          </Heading>
          <Box bg="white" rounded="xl" p={4} shadow={2}>
            <VStack space={3}>
              <HStack space={3} alignItems="center">
                <Box bg="red.100" rounded="lg" p={2}>
                  <Icon as={MaterialIcons} name="event" size="sm" color="red.600" />
                </Box>
                <VStack flex={1}>
                  <Text fontWeight="600">Parent-Teacher Meeting</Text>
                  <Text fontSize="xs" color="gray.500">Dec 15, 2024 • 10:00 AM</Text>
                </VStack>
                <Badge colorScheme="red" rounded="md">3 days</Badge>
              </HStack>
              <HStack space={3} alignItems="center">
                <Box bg="blue.100" rounded="lg" p={2}>
                  <Icon as={MaterialIcons} name="celebration" size="sm" color="blue.600" />
                </Box>
                <VStack flex={1}>
                  <Text fontWeight="600">Annual Day Celebration</Text>
                  <Text fontSize="xs" color="gray.500">Dec 20, 2024 • 4:00 PM</Text>
                </VStack>
                <Badge colorScheme="blue" rounded="md">8 days</Badge>
              </HStack>
            </VStack>
          </Box>
        </VStack>
      </ScrollView>
    </Box>
  );
}

