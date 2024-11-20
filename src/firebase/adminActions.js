import { collection, deleteDoc, doc, getDoc, updateDoc, query, getDocs, setDoc, where, writeBatch, limit } from 'firebase/firestore';
import { db } from './firebase';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

const auth = getAuth();

// Function to check if any admin exists
export const checkIfAdminExists = async () => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef, 
      where('isAdmin', '==', true),
      where('role', '==', 'admin'),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking admin existence:', error);
    throw error;
  }
};

// Function to set up initial admin user
export const setupInitialAdmin = async (uid) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User document does not exist');
    }

    const batch = writeBatch(db);
    
    // Update user document
    batch.update(userRef, {
      isAdmin: true,
      role: 'admin',
      updatedAt: new Date().toISOString()
    });

    // Create admin claims document
    const claimsRef = doc(db, 'adminClaims', uid);
    batch.set(claimsRef, {
      isAdmin: true,
      createdAt: new Date().toISOString()
    });

    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error setting up initial admin:', error);
    throw error;
  }
};

// Function to add a new user
export const addUser = async (email) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, 'defaultPassword');
    console.log('User created:', userCredential.user.uid);
    return userCredential.user;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// Function to toggle admin status
export const toggleAdminStatus = async (uid) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const currentStatus = userDoc.data().isAdmin || false;
      await updateDoc(userRef, {
        isAdmin: !currentStatus
      });
      return {
        success: true,
        message: `User is now ${!currentStatus ? 'an admin' : 'not an admin'}`
      };
    } else {
      throw new Error('User not found');
    }
  } catch (error) {
    console.error('Error toggling admin status:', error);
    throw error;
  }
};

// Function to delete a cabinet
export const deleteCabinet = async (cabinetId) => {
  try {
    const cabinetRef = doc(db, 'cabinets', cabinetId);
    await deleteDoc(cabinetRef);
    console.log('Cabinet deleted:', cabinetId);
  } catch (error) {
    console.error('Error deleting cabinet:', error);
    throw error;
  }
};