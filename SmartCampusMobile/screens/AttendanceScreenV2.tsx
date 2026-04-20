import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  ScrollView,
  Avatar,
  Pressable,
  Icon,
  Button,
  useToast,
  Badge,
  Divider,
  Select,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function AttendanceScreenV2({ navigation }: any) {
  const [selectedClass, setSelectedClass] = useState('10-A');
  const [attendance, setAttendance] = useState<Record<string, string>>({
    student1: 'present',
    student2: 'present',
    student3: 'absent',
    student4: 'present',
    student5: 'late',
  });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const students = [
    { id: 'student1', name: 'Alice Johnson', roll: '01', avatar: 'AJ' },
    { id: 'student2', name: 'Bob Smith', roll: '02', avatar: 'BS' },
    { id: 'student3', name: 'Charlie Brown', roll: '03', avatar: 'CB' },
    { id: 'student4', name: 'Diana Prince', roll: '04', avatar: 'DP' },
    { id: 'student5', name: 'Eve Wilson', roll: '05', avatar: 'EW' },
    { id: 'student6', name: 'Frank Miller', roll: '06', avatar: 'FM' },
    { id: 'student7', name: 'Grace Lee', roll: '07', avatar: 'GL' },
    { id: 'student8', name: 'Henry Davis', roll: '08', avatar: 'HD' },
  ];

  // Initialize all students
  React.useEffect(() => {
    const initialAttendance: Record<string, string> = {};
    students.forEach(s => {
      initialAttendance[s.id] = attendance[s.id] || 'present';
    });
    setAttendance(initialAttendance);
  }, []);

  const toggleAttendance = (studentId: string) => {
    const statuses = ['present', 'absent', 'late'];
    const currentIndex = statuses.indexOf(attendance[studentId] || 'present');
    const nextIndex = (currentIndex + 1) % statuses.length;
    setAttendance({ ...attendance, [studentId]: statuses[nextIndex] });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'green';
      case 'absent':
        return 'red';
      case 'late':
        return 'orange';
      default:
        return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return 'check-circle';
      case 'absent':
        return 'cancel';
      case 'late':
        return 'schedule';
      default:
        return 'help';
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // API call would go here
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.show({
        title: 'Success!',
        description: 'Attendance saved successfully',
        placement: 'top',
      });
    } catch (error) {
      toast.show({
        title: 'Error',
        description: 'Failed to save attendance',
        placement: 'top',
      });
    } finally {
      setLoading(false);
    }
  };

  const markAllPresent = () => {
    const allPresent: Record<string, string> = {};
    students.forEach(s => allPresent[s.id] = 'present');
    setAttendance(allPresent);
  };

  const presentCount = Object.values(attendance).filter(s => s === 'present').length;
  const absentCount = Object.values(attendance).filter(s => s === 'absent').length;
  const lateCount = Object.values(attendance).filter(s => s === 'late').length;

  return (
    <Box flex={1} bg="gray.50">
      {/* Header */}
      <Box>
        <LinearGradient
          colors={['#2196F3', '#1976D2']}
          style={{ paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 }}
        >
          <HStack alignItems="center" mb={4}>
            <Pressable onPress={() => navigation.goBack()}>
              <Icon as={MaterialIcons} name="arrow-back" size="lg" color="white" />
            </Pressable>
            <Heading color="white" size="lg" ml={3} flex={1}>
              Mark Attendance
            </Heading>
          </HStack>

          {/* Class Selector */}
          <Box bg="rgba(255,255,255,0.2)" rounded="lg" mb={3}>
            <Select
              selectedValue={selectedClass}
              onValueChange={setSelectedClass}
              color="white"
              fontSize="md"
              borderWidth={0}
              _selectedItem={{ bg: "blue.100" }}
            >
              <Select.Item label="Class 10-A" value="10-A" />
              <Select.Item label="Class 10-B" value="10-B" />
              <Select.Item label="Class 9-A" value="9-A" />
              <Select.Item label="Class 9-B" value="9-B" />
            </Select>
          </Box>

          {/* Stats */}
          <HStack space={4}>
            <HStack space={2} alignItems="center" bg="rgba(255,255,255,0.2)" rounded="full" px={3} py={1}>
              <Box bg="green.400" rounded="full" p={1}>
                <Icon as={MaterialIcons} name="check" size="xs" color="white" />
              </Box>
              <Text color="white" fontWeight="600">{presentCount}</Text>
            </HStack>
            <HStack space={2} alignItems="center" bg="rgba(255,255,255,0.2)" rounded="full" px={3} py={1}>
              <Box bg="red.400" rounded="full" p={1}>
                <Icon as={MaterialIcons} name="close" size="xs" color="white" />
              </Box>
              <Text color="white" fontWeight="600">{absentCount}</Text>
            </HStack>
            <HStack space={2} alignItems="center" bg="rgba(255,255,255,0.2)" rounded="full" px={3} py={1}>
              <Box bg="orange.400" rounded="full" p={1}>
                <Icon as={MaterialIcons} name="schedule" size="xs" color="white" />
              </Box>
              <Text color="white" fontWeight="600">{lateCount}</Text>
            </HStack>
          </HStack>
        </LinearGradient>
      </Box>

      {/* Quick Actions */}
      <HStack space={2} px={4} py={3} bg="white" shadow={1}>
        <Button
          flex={1}
          size="sm"
          variant="outline"
          colorScheme="green"
          leftIcon={<Icon as={MaterialIcons} name="check-circle" size="sm" />}
          onPress={markAllPresent}
        >
          All Present
        </Button>
        <Button
          flex={1}
          size="sm"
          variant="outline"
          colorScheme="gray"
          leftIcon={<Icon as={MaterialIcons} name="history" size="sm" />}
          onPress={() => navigation.navigate('AttendanceHistory')}
        >
          History
        </Button>
      </HStack>

      {/* Student List */}
      <ScrollView px={4} pt={3}>
        <VStack space={3}>
          {students.map((student) => {
            const status = attendance[student.id] || 'present';
            const color = getStatusColor(status);
            
            return (
              <Pressable key={student.id} onPress={() => toggleAttendance(student.id)}>
                {({ isPressed }) => (
                  <Box
                    bg="white"
                    rounded="xl"
                    p={4}
                    shadow={2}
                    borderLeftWidth={4}
                    borderLeftColor={`${color}.500`}
                    style={{ transform: [{ scale: isPressed ? 0.98 : 1 }] }}
                  >
                    <HStack alignItems="center" space={3}>
                      <Avatar size="md" bg={`${color}.500`}>
                        {student.avatar}
                      </Avatar>
                      
                      <VStack flex={1}>
                        <Text fontWeight="600" fontSize="md">
                          {student.name}
                        </Text>
                        <Text fontSize="sm" color="gray.500">
                          Roll No. {student.roll}
                        </Text>
                      </VStack>

                      <VStack alignItems="center" space={1}>
                        <Box bg={`${color}.100`} rounded="full" p={2}>
                          <Icon
                            as={MaterialIcons}
                            name={getStatusIcon(status)}
                            size="md"
                            color={`${color}.600`}
                          />
                        </Box>
                        <Text fontSize="xs" color={`${color}.600`} fontWeight="600">
                          {status.toUpperCase()}
                        </Text>
                      </VStack>
                    </HStack>
                  </Box>
                )}
              </Pressable>
            );
          })}
        </VStack>

        {/* Spacer for bottom button */}
        <Box h={24} />
      </ScrollView>

      {/* Save Button */}
      <Box position="absolute" bottom={0} left={0} right={0} bg="white" p={4} shadow={6}>
        <Button
          size="lg"
          bg="primary.500"
          _pressed={{ bg: 'primary.600' }}
          onPress={handleSave}
          isLoading={loading}
          isLoadingText="Saving..."
          leftIcon={<Icon as={MaterialIcons} name="save" color="white" />}
        >
          Save Attendance
        </Button>
      </Box>
    </Box>
  );
}

