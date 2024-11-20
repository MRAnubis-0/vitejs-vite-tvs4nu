import React, { useState, useEffect } from 'react';
import { auth, db, usersRef, cabinetsRef } from '../firebase/firebase';
import { getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { addUser, toggleAdminStatus as toggleUserAdminStatus } from '../firebase/adminActions';
import {
  Box,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input,
  VStack,
  useToast,
  Heading,
} from '@chakra-ui/react';

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [cabins, setCabins] = useState([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newCabinetCode, setNewCabinetCode] = useState('');
  const toast = useToast();

  useEffect(() => {
    loadUsers();
    loadCabins();
  }, []);

  const loadUsers = async () => {
    try {
      const snapshot = await getDocs(usersRef);
      const usersList = snapshot.docs.map(doc => ({
        id: doc.id,
        email: doc.data().email,
        isAdmin: doc.data().isAdmin || false
      }));
      setUsers(usersList);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load users',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const loadCabins = async () => {
    try {
      const snapshot = await getDocs(cabinetsRef);
      const cabinsList = snapshot.docs.map(doc => ({
        id: doc.id,
        code: doc.data().code
      }));
      setCabins(cabinsList);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load cabins',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleAddUser = async () => {
    if (!newUserEmail) return;
    try {
      const result = await addUser(newUserEmail);
      const userRef = doc(db, 'users', result.uid);
      await setDoc(userRef, {
        email: newUserEmail,
        isAdmin: false,
        createdAt: new Date().toISOString()
      });

      // Force token refresh after setting admin claim
      await auth.currentUser?.getIdToken(true);
      
      toast({
        title: 'Success',
        description: 'User added successfully',
        status: 'success',
        duration: 3000,
      });
      setNewUserEmail('');
      loadUsers();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    }
  };

  const toggleAdminStatus = async (uid) => {
    try {
      const result = await toggleUserAdminStatus(uid);
      toast({
        title: 'Success',
        description: result.message,
        status: 'success',
        duration: 3000,
      });
      loadUsers();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    }
  };

  const removeUser = async (userId) => {
    try {
      await deleteDoc(doc(db, 'users', userId));
      toast({
        title: 'Success',
        description: 'User  removed successfully',
        status: 'success',
        duration: 3000,
      });
      loadUsers();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    }
  };

  const addCabinet = async () => {
    if (!newCabinetCode) return;
    try {
      const cabinetRef = doc(cabinetsRef, newCabinetCode);
      await setDoc(cabinetRef, { code: newCabinetCode });
      toast({
        title: 'Success',
        description: 'Cabinet added successfully',
        status: 'success',
        duration: 3000,
      });
      setNewCabinetCode('');
      loadCabins();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    }
  };

  const removeCabinet = async (cabinetId) => {
    try {
      await deleteDoc(doc(cabinetsRef, cabinetId));
      toast({
        title: 'Success',
        description: 'Cabinet removed successfully',
        status: 'success',
        duration: 3000,
      });
      loadCabins();
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
    <Box p={8} bg="gray.50" borderRadius="md" boxShadow="md">
      <VStack spacing={4}>
        <Heading as="h1" size="lg">Admin Dashboard</Heading>
        
        <Box w="100%" bg="white" p={4} borderRadius="md" boxShadow="sm">
          <Heading as="h2" size="md">Manage Users</Heading>
          <Input
            placeholder="New User Email"
            value={newUserEmail} 
            onChange={(e) => setNewUserEmail(e.target.value)} 
            mb={4}
          />
          <Button colorScheme="teal" onClick={handleAddUser}>Add User</Button>

          <Table variant="simple" mt={4}>
            <Thead>
              <Tr>
                <Th>User ID</Th>
                <Th>Email</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {users.map((user) => (
                <Tr key={user.id}>
                  <Td>{user.id}</Td>
                  <Td>{user.email}</Td>
                  <Td>
                    <Button
                      colorScheme="blue"
                      mr={2}
                      onClick={() => toggleAdminStatus(user.id)}
                    >
                      {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                    </Button>
                    <Button 
                      colorScheme="red" 
                      onClick={() => removeUser(user.id)}
                    >
                      Remove
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>

        <Box w="100%" bg="white" p={4} borderRadius="md" boxShadow="sm">
          <Heading as="h2" size="md">Manage Cabinets</Heading>
          <Input
            placeholder="New Cabinet Code"
            value={newCabinetCode}
            onChange={(e) => setNewCabinetCode(e.target.value)}
            mb={4}
          />
          <Button colorScheme="teal" onClick={addCabinet}>Add Cabinet</Button>

          <Table variant="simple" mt={4}>
            <Thead>
              <Tr>
                <Th>Cabinet Code</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {cabins.map((cabinet) => (
                <Tr key={cabinet.id}>
                  <Td>{cabinet.code}</Td>
                  <Td>
                    <Button colorScheme="red" onClick={() => removeCabinet(cabinet.id)}>Remove</Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </VStack>
    </Box>
  );
}

export default AdminDashboard;