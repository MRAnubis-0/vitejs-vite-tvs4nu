import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, setDoc, updateDoc, connectFirestoreEmulator, enableIndexedDbPersistence } from 'firebase/firestore';
import { firebaseConfig, validateConfig } from './config';

let app;
let db;
let auth;

// Validate configuration before initializing
try {
  validateConfig();
} catch (error) {
  console.error('Firebase configuration validation failed:', error);
  throw error;
}

const initializeFirebase = async (retryCount = 0) => {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    
    // Connect to emulator in development environment
    if (process.env.NODE_ENV === 'development') {
      console.log('Connecting to Firestore emulator...');
      connectFirestoreEmulator(db, 'localhost', 8080);
    }
    
    // Verify authentication before testing connection
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.warn('No authenticated user found. Some operations may be restricted.');
    }
    
    // Test the connection with error details
    try {
      await getDoc(doc(db, 'test', 'test'));
      console.log('Firebase initialized successfully');
    } catch (docError) {
      console.error('Failed to test Firestore connection:', {
        code: docError.code,
        message: docError.message,
        details: docError.details
      });
      throw docError;
    }
  } catch (error) {
    console.error(`Firebase initialization attempt ${retryCount + 1} failed:`, {
      code: error.code,
      message: error.message,
      details: error.details
    });
    
    if (error.code === 'permission-denied') {
      console.error('Permission denied error detected. Please check:');
      console.error('1. Firebase configuration is correct');
      console.error('2. User authentication status');
      console.error('3. Firestore security rules');
      throw error;
    }
    
    if (retryCount < firebaseConfig.retry.maxAttempts) {
      const delay = firebaseConfig.retry.delay * Math.pow(2, retryCount); // Exponential backoff
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return initializeFirebase(retryCount + 1);
    }
    
    throw new Error(`Failed to initialize Firebase after ${retryCount + 1} attempts: ${error.message}`);
  }
};

await initializeFirebase();

export { auth, db };

// Initialize Firestore with persistence
const initializePersistence = async () => {
  try {
    await enableIndexedDbPersistence(db);
  } catch (err) {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      console.warn('The current browser does not support persistence.');
    } else {
      console.error('Error enabling persistence:', err);
    }
  }
};

initializePersistence();

// Firestore collection references
export const usersRef = collection(db, 'users');
export const cabinetsRef = collection(db, 'cabinets');
export const logsRef = collection(db, 'logs');

// Helper function to create a new user document
export const createUserDocument = async (uid, data) => {
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, {
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
};

// Helper function to update a user document
export const updateUserDocument = async (uid, data) => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    ...data,
    updatedAt: new Date().toISOString()
  });
};

// Helper function to create a log entry
export const createLogEntry = async (userId, action, details, cabinetId = null) => {
  const logRef = doc(logsRef);
  await setDoc(logRef, {
    userId,
    action,
    details,
    cabinetId,
    timestamp: new Date().toISOString()
  });
};
// Function to check if user is admin
export const checkUserAdmin = async (user) => {
  if (!user) return false;
  try {
    const idTokenResult = await user.getIdTokenResult();
    return !!idTokenResult.claims.admin;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// Hook to get current user's admin status
export const useAdmin = (callback) => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const isAdmin = await checkUserAdmin(user);
      callback(isAdmin);
    } else {
      callback(false);
    }
  });
};