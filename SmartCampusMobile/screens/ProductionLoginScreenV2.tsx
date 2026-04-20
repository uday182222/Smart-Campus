import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Input,
  Button,
  Center,
  FormControl,
  Icon,
  Pressable,
  useToast,
  KeyboardAvoidingView,
  ScrollView,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';

export default function ProductionLoginScreenV2({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password || !schoolId) {
      toast.show({
        title: 'Missing fields',
        description: 'Please fill all fields',
        placement: 'top',
      });
      return;
    }

    setLoading(true);
    try {
      await login(email, password, schoolId);
      // Navigation handled by AuthContext
    } catch (error: any) {
      setLoading(false);
      toast.show({
        title: 'Login failed',
        description: error.message || 'Invalid credentials',
        placement: 'top',
      });
    }
  };

  return (
    <Box flex={1} bg="white">
      <LinearGradient
        colors={['#2196F3', '#1976D2', '#0D47A1']}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '100%' }}
      />
      
      <KeyboardAvoidingView
        flex={1}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <Center flex={1} px={4}>
            {/* Logo Section */}
            <VStack space={4} alignItems="center" mb={8}>
              <Box
                bg="white"
                rounded="full"
                p={6}
                shadow={9}
              >
                <Icon
                  as={MaterialIcons}
                  name="school"
                  size="4xl"
                  color="primary.500"
                />
              </Box>
              <Heading color="white" size="2xl" fontWeight="bold">
                Smart Campus
              </Heading>
              <Text color="white" fontSize="md" opacity={0.9}>
                School Management System
              </Text>
            </VStack>

            {/* Login Form */}
            <Box
              bg="white"
              rounded="2xl"
              shadow={9}
              p={8}
              w="100%"
              maxW="400px"
            >
              <VStack space={4}>
                <Heading size="lg" color="gray.800" mb={2}>
                  Welcome Back
                </Heading>

                {/* School ID */}
                <FormControl>
                  <FormControl.Label>School ID</FormControl.Label>
                  <Input
                    placeholder="Enter school ID"
                    value={schoolId}
                    onChangeText={setSchoolId}
                    size="lg"
                    InputLeftElement={
                      <Icon
                        as={MaterialIcons}
                        name="business"
                        size={5}
                        ml={2}
                        color="gray.400"
                      />
                    }
                  />
                </FormControl>

                {/* Email */}
                <FormControl>
                  <FormControl.Label>Email</FormControl.Label>
                  <Input
                    placeholder="Enter your email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    size="lg"
                    InputLeftElement={
                      <Icon
                        as={MaterialIcons}
                        name="email"
                        size={5}
                        ml={2}
                        color="gray.400"
                      />
                    }
                  />
                </FormControl>

                {/* Password */}
                <FormControl>
                  <FormControl.Label>Password</FormControl.Label>
                  <Input
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={setPassword}
                    type={showPassword ? 'text' : 'password'}
                    size="lg"
                    InputLeftElement={
                      <Icon
                        as={MaterialIcons}
                        name="lock"
                        size={5}
                        ml={2}
                        color="gray.400"
                      />
                    }
                    InputRightElement={
                      <Pressable onPress={() => setShowPassword(!showPassword)}>
                        <Icon
                          as={MaterialIcons}
                          name={showPassword ? 'visibility' : 'visibility-off'}
                          size={5}
                          mr={2}
                          color="gray.400"
                        />
                      </Pressable>
                    }
                  />
                </FormControl>

                {/* Login Button */}
                <Button
                  size="lg"
                  bg="primary.500"
                  _pressed={{ bg: 'primary.600' }}
                  onPress={handleLogin}
                  isLoading={loading}
                  isLoadingText="Logging in..."
                  mt={4}
                >
                  Login
                </Button>

                {/* Forgot Password */}
                <Pressable onPress={() => {}}>
                  <Text color="primary.500" textAlign="center" fontSize="sm">
                    Forgot Password?
                  </Text>
                </Pressable>
              </VStack>
            </Box>

            {/* Demo Credentials */}
            <Box mt={6} p={4} bg="rgba(255,255,255,0.2)" rounded="lg">
              <Text color="white" fontSize="xs" textAlign="center">
                Demo: teacher@school.com / password123
              </Text>
            </Box>
          </Center>
        </ScrollView>
      </KeyboardAvoidingView>
    </Box>
  );
}

