import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { checkIfAdminExists, setupInitialAdmin } from '../firebase/adminActions';
import { doc, setDoc, getFirestore } from 'firebase/firestore';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  useToast,
} from '@chakra-ui/react';

function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const toast = useToast();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      // Create the user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      
      // Create initial user document
      const db = getFirestore();
      await setDoc(doc(db, 'users', uid), {
        email: email,
        isAdmin: false,
        createdAt: new Date().toISOString()
      });

      // Check if this should be the first admin
      const adminExists = await checkIfAdminExists();
      if (!adminExists) {
        await setupInitialAdmin(uid);
        toast({
          title: 'Admin Account Created',
          description: 'You have been set up as the first admin user.',
          status: 'success',
          duration: 5000,
        });
      }

      navigate('/');
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    }
  };

  return (
    <Box p={8}>
      <VStack spacing={4} align="stretch">
        <Heading>Sign Up</Heading>
        <FormControl>
          <FormLabel>Email</FormLabel>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </FormControl>
        <FormControl>
          <FormLabel>Password</FormLabel>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </FormControl>
        <Button colorScheme="blue" onClick={handleSignup}>
          Sign Up
        </Button>
        <Text>
          Already have an account? <Link to="/login">Login</Link>
        </Text>
      </VStack>
    </Box>
  );
}

export default Signup;