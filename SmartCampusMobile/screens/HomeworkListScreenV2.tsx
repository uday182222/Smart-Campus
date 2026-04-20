import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  ScrollView,
  Icon,
  Pressable,
  Badge,
  Fab,
  Select,
  Input,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RefreshControl } from 'react-native';

export default function HomeworkListScreenV2({ navigation }: any) {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedClass, setSelectedClass] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const homeworks = [
    {
      id: 1,
      subject: 'Mathematics',
      title: 'Chapter 5: Quadratic Equations',
      description: 'Solve exercises 5.1 to 5.3 from textbook',
      dueDate: 'Tomorrow',
      dueIn: 1,
      status: 'pending',
      submissions: '15/30',
      submissionPercent: 50,
      color: 'blue',
      className: '10-A',
    },
    {
      id: 2,
      subject: 'Science',
      title: 'Lab Report: Photosynthesis',
      description: 'Write a detailed lab report on the photosynthesis experiment',
      dueDate: 'In 3 days',
      dueIn: 3,
      status: 'pending',
      submissions: '20/30',
      submissionPercent: 67,
      color: 'green',
      className: '10-A',
    },
    {
      id: 3,
      subject: 'English',
      title: 'Essay Writing',
      description: 'Write an essay on "Climate Change and Its Effects"',
      dueDate: 'Overdue',
      dueIn: -1,
      status: 'overdue',
      submissions: '10/30',
      submissionPercent: 33,
      color: 'red',
      className: '10-B',
    },
    {
      id: 4,
      subject: 'History',
      title: 'Chapter 7 Notes',
      description: 'Complete notes for Industrial Revolution chapter',
      dueDate: 'In 5 days',
      dueIn: 5,
      status: 'pending',
      submissions: '5/30',
      submissionPercent: 17,
      color: 'purple',
      className: '9-A',
    },
    {
      id: 5,
      subject: 'Physics',
      title: 'Numerical Problems',
      description: 'Solve numerical problems from Mechanics chapter',
      dueDate: 'Completed',
      dueIn: 0,
      status: 'completed',
      submissions: '28/30',
      submissionPercent: 93,
      color: 'gray',
      className: '10-A',
    },
  ];

  const filteredHomeworks = homeworks.filter(hw => {
    const matchesClass = selectedClass === 'all' || hw.className === selectedClass;
    const matchesSearch = hw.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          hw.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesClass && matchesSearch;
  });

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getStatusBadge = (status: string, dueIn: number) => {
    if (status === 'completed') {
      return <Badge colorScheme="green" rounded="md">Completed</Badge>;
    }
    if (status === 'overdue') {
      return <Badge colorScheme="red" rounded="md">Overdue</Badge>;
    }
    if (dueIn <= 1) {
      return <Badge colorScheme="orange" rounded="md">Due Soon</Badge>;
    }
    return <Badge colorScheme="blue" rounded="md">Active</Badge>;
  };

  return (
    <Box flex={1} bg="gray.50">
      {/* Header */}
      <Box>
        <LinearGradient
          colors={['#4CAF50', '#388E3C']}
          style={{ paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 }}
        >
          <HStack alignItems="center" mb={4}>
            <Pressable onPress={() => navigation.goBack()}>
              <Icon as={MaterialIcons} name="arrow-back" size="lg" color="white" />
            </Pressable>
            <Heading color="white" size="lg" ml={3} flex={1}>
              Homework
            </Heading>
            <Pressable onPress={() => navigation.navigate('HomeworkStats')}>
              <Icon as={MaterialIcons} name="bar-chart" size="lg" color="white" />
            </Pressable>
          </HStack>

          <Text color="white" opacity={0.9} mb={3}>
            Manage and track homework assignments
          </Text>

          {/* Search Bar */}
          <Input
            placeholder="Search homework..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            bg="rgba(255,255,255,0.9)"
            rounded="lg"
            py={2}
            InputLeftElement={
              <Icon as={MaterialIcons} name="search" size="sm" ml={3} color="gray.400" />
            }
          />
        </LinearGradient>
      </Box>

      {/* Filter Bar */}
      <HStack px={4} py={3} bg="white" shadow={1} space={3} alignItems="center">
        <Text fontSize="sm" color="gray.600">Filter:</Text>
        <Select
          selectedValue={selectedClass}
          onValueChange={setSelectedClass}
          flex={1}
          size="sm"
          _selectedItem={{ bg: "green.100" }}
        >
          <Select.Item label="All Classes" value="all" />
          <Select.Item label="Class 10-A" value="10-A" />
          <Select.Item label="Class 10-B" value="10-B" />
          <Select.Item label="Class 9-A" value="9-A" />
        </Select>
        <Badge colorScheme="green" rounded="full" px={2}>
          {filteredHomeworks.length}
        </Badge>
      </HStack>

      {/* Homework List */}
      <ScrollView
        px={4}
        pt={3}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <VStack space={3}>
          {filteredHomeworks.map((hw) => (
            <Pressable
              key={hw.id}
              onPress={() => navigation.navigate('HomeworkDetail', { id: hw.id })}
            >
              {({ isPressed }) => (
                <Box
                  bg="white"
                  rounded="xl"
                  p={4}
                  shadow={2}
                  borderLeftWidth={4}
                  borderLeftColor={`${hw.color}.500`}
                  style={{ transform: [{ scale: isPressed ? 0.98 : 1 }] }}
                  opacity={hw.status === 'completed' ? 0.7 : 1}
                >
                  <HStack space={3} alignItems="flex-start">
                    <Box bg={`${hw.color}.100`} rounded="lg" p={3}>
                      <Icon
                        as={MaterialIcons}
                        name="assignment"
                        size="md"
                        color={`${hw.color}.600`}
                      />
                    </Box>

                    <VStack flex={1} space={2}>
                      <HStack alignItems="center" justifyContent="space-between">
                        <Badge colorScheme={hw.color} rounded="md">
                          {hw.subject}
                        </Badge>
                        {getStatusBadge(hw.status, hw.dueIn)}
                      </HStack>

                      <Heading size="sm" color="gray.800">
                        {hw.title}
                      </Heading>

                      <Text fontSize="sm" color="gray.600" numberOfLines={2}>
                        {hw.description}
                      </Text>

                      <HStack space={4} mt={1} alignItems="center">
                        <HStack space={1} alignItems="center">
                          <Icon as={MaterialIcons} name="class" size="xs" color="gray.400" />
                          <Text fontSize="xs" color="gray.500">{hw.className}</Text>
                        </HStack>
                        <HStack space={1} alignItems="center">
                          <Icon as={MaterialIcons} name="people" size="xs" color="gray.400" />
                          <Text fontSize="xs" color="gray.500">{hw.submissions}</Text>
                        </HStack>
                        <HStack space={1} alignItems="center">
                          <Icon as={MaterialIcons} name="schedule" size="xs" color="gray.400" />
                          <Text fontSize="xs" color={hw.status === 'overdue' ? 'red.500' : 'gray.500'}>
                            {hw.dueDate}
                          </Text>
                        </HStack>
                      </HStack>

                      {/* Submission Progress */}
                      <Box mt={1}>
                        <HStack justifyContent="space-between" mb={1}>
                          <Text fontSize="xs" color="gray.500">Submissions</Text>
                          <Text fontSize="xs" color="gray.600" fontWeight="600">
                            {hw.submissionPercent}%
                          </Text>
                        </HStack>
                        <Box bg="gray.200" rounded="full" h={1.5}>
                          <Box
                            bg={hw.submissionPercent >= 70 ? 'green.500' : hw.submissionPercent >= 40 ? 'orange.500' : 'red.500'}
                            rounded="full"
                            h={1.5}
                            w={`${hw.submissionPercent}%`}
                          />
                        </Box>
                      </Box>
                    </VStack>

                    <Icon as={MaterialIcons} name="chevron-right" size="md" color="gray.400" />
                  </HStack>
                </Box>
              )}
            </Pressable>
          ))}
        </VStack>

        {/* Empty State */}
        {filteredHomeworks.length === 0 && (
          <Box alignItems="center" py={10}>
            <Icon as={MaterialIcons} name="assignment" size="4xl" color="gray.300" />
            <Text color="gray.500" mt={3}>No homework found</Text>
          </Box>
        )}

        {/* Spacer for FAB */}
        <Box h={24} />
      </ScrollView>

      {/* FAB */}
      <Fab
        renderInPortal={false}
        shadow={5}
        size="lg"
        bg="green.500"
        _pressed={{ bg: 'green.600' }}
        onPress={() => navigation.navigate('HomeworkCreate')}
        icon={<Icon as={MaterialIcons} name="add" size="lg" color="white" />}
        label={<Text color="white" fontWeight="600">New</Text>}
      />
    </Box>
  );
}

