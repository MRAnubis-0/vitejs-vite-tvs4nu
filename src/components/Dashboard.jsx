import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';
import { useNavigate } from 'react-router-dom'; 
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  VStack,
  HStack,
  Heading,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  FormErrorMessage,
  Input as SearchInput,
  Text,
} from '@chakra-ui/react';

const cabinets = [
  { code: '03-3-20-53', type: 'Huawei' },
  { code: '03-3-20-52', type: 'Huawei' },
  { code: '03-3-20-32', type: 'Huawei' },
];

const ITEMS_PER_PAGE = 5;

function Dashboard() {
  const [selectedCabinet, setSelectedCabinet] = useState('');
  const [number, setNumber] = useState('');
  const [cabOut, setCabOut] = useState('');
  const [block, setBlock] = useState('');
  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }
    loadEntries();
  }, [selectedCabinet, navigate]);

  useEffect(() => {
    const filtered = entries.filter(entry =>
      entry.number.includes(searchTerm) ||
      entry.cabOut.includes(searchTerm) ||
      entry.block.includes(searchTerm)
    );
    setFilteredEntries(filtered);
    setCurrentPage(1);
  }, [searchTerm, entries]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!number) {
      newErrors.number = 'Number is required';
    } else if (!/^\d+$/.test(number)) {
      newErrors.number = 'Must be a valid number';
    }
    
    if (!cabOut) {
      newErrors.cabOut = 'Cab Out is required';
    } else if (!/^(100|[1-9][0-9])$/.test(cabOut)) { // Check if cabOut is between 1 and 100
      newErrors.cabOut = 'Cab Out must be a number between 1 and 100';
    }
    
    if (!block) {
      newErrors.block = 'Block is required';
    } else if (!/^(25|[1-9]?[0-9])$/.test(block)) { // Check if block is between 1 and 25
      newErrors.block = 'Block must be a number between 1 and 25';
    }
  
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const loadEntries = async () => {
    if (!selectedCabinet || !auth.currentUser) {
      setEntries([]);
      setFilteredEntries([]);
      return;
    }
    
    try {
      const entriesRef = collection(db, 'entries');
      const q = query(
        entriesRef,
        where('userId', '==', auth.currentUser.uid),
        where('cabinetId', '==', selectedCabinet),
        orderBy('timestamp', 'desc')
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const sortedEntries = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setEntries(sortedEntries);
        setFilteredEntries(sortedEntries);
      } else {
        setEntries([]);
        setFilteredEntries([]);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load entries',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCabinet) {
      toast({
        title: 'Error',
        description: 'Please select a cabinet',
        status: 'error',
        duration: 3000,
      });
      return;
    }
  
    if (!validateForm()) return;
  
    // Check for duplicate number
    const isDuplicate = entries.some(entry => entry.number === number);
    if (isDuplicate) {
      toast({
        title: 'Error',
        description: 'This number already exists.',
        status: 'error',
        duration: 3000,
      });
      return;
    }
  
    setIsSubmitting(true);
    try {
      const entriesRef = collection(db, 'entries');
      await addDoc(entriesRef, {
        userId: auth.currentUser.uid,
        cabinetId: selectedCabinet,
        number,
        cabOut,
        block,
        timestamp: Date.now(),
      });
      
      toast({
        title: 'Success',
        description: 'Entry saved successfully',
        status: 'success',
        duration: 3000,
      });
      
      setNumber('');
      setCabOut('');
      setBlock('');
      loadEntries();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to logout',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['Number', 'Cab Out', 'Block', 'Date'],
      ...filteredEntries.map(entry => [
        entry.number,
        entry.cabOut,
        entry.block,
        new Date(entry.timestamp).toLocaleString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedCabinet}-entries.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalPages = Math.ceil(filteredEntries.length / ITEMS_PER_PAGE);
  const paginatedEntries = filteredEntries.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <Box p={8}>
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between">
          <Heading>Data Entry Dashboard</Heading>
          <Button colorScheme="red" onClick={handleLogout}>
            Logout
          </Button>
        </HStack>
        
        <FormControl isRequired>
          <FormLabel>Select Cabinet</FormLabel>
          <Select
            value={selectedCabinet}
            onChange={(e) => setSelectedCabinet(e.target.value)}
          >
            <option value="">Select a cabinet</option>
            {cabinets.map((cab) => (
              <option key={cab.code} value={cab.code}>
                {cab.code} - {cab.type}
              </option>
            ))}
          </Select>
        </FormControl>

        {selectedCabinet && (
          <>
            <VStack spacing={4} align="stretch">
              <FormControl isInvalid={!!errors.number} isRequired>
                <FormLabel>Number</FormLabel>
                <Input
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="الرقم الارضي"
                />
                <FormErrorMessage>{errors.number}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.cabOut} isRequired>
                <FormLabel>Cab Out</FormLabel>
                <Input
                  value={cabOut}
                  onChange={(e) => setCabOut(e.target.value)}
                  placeholder="الخارج"
                />
                <FormErrorMessage>{errors.cabOut}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.block} isRequired>
                <FormLabel>Block</FormLabel>
                <Input
                  value={block}
                  onChange={(e) => setBlock(e.target.value)}
                  placeholder="البلوك (الميه)"
                />
                <FormErrorMessage>{errors.block}</FormErrorMessage>
              </FormControl>

              <Button 
                colorScheme="blue" 
                onClick={handleSubmit}
                isLoading={isSubmitting}
                loadingText="Saving"
              >
                Save Entry
              </Button>
            </VStack>

            <HStack spacing={4}>
              <SearchInput
                placeholder="Search entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button colorScheme="green" onClick={handleExport}>
                Export CSV
              </Button>
            </HStack>

            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Number</Th>
                  <Th>Cab Out</Th>
                  <Th>Block</Th>
                  <Th>Date</Th>
                </Tr>
              </Thead>
              <Tbody>
                {paginatedEntries.map((entry, index) => (
                  <Tr key={index}>
                    <Td>{entry.number}</Td>
                    <Td>{entry.cabOut}</Td>
                    <Td>{entry.block}</Td>
                    <Td>{new Date(entry.timestamp).toLocaleString()}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>

            {totalPages > 1 && (
              <HStack justify="center" spacing={2}>
                <Button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                >
                  Previous
                </Button>
                <Text>
                  Page {currentPage} of {totalPages}
                </Text>
                <Button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  Next
                </Button>
              </HStack>
            )}
          </>
        )}
      </VStack>
    </Box>
  );
}

export default Dashboard;