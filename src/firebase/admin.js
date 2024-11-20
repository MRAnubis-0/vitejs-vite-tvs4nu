import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { auth as firebaseAuth } from './firebase';

// Get Firestore instance using the existing app
const db = getFirestore(firebaseAuth.app);

// Set custom user claims
const setAdminClaim = async (uid) => {
  try {
    const idToken = await firebaseAuth.currentUser.getIdToken(true);
    // Here you would typically make an API call to your backend
    // which would then set the admin claim using admin SDK
    console.log(`Request to set admin claim for user ${uid}`);
    return true;
  } catch (error) {
    console.error('Error setting admin claim:', error);
    throw error;
  }
};

// Remove admin claims
const removeAdminClaim = async (uid) => {
  try {
    const idToken = await firebaseAuth.currentUser.getIdToken(true);
    // Here you would typically make an API call to your backend
    // which would then remove the admin claim using admin SDK
    console.log(`Request to remove admin claim for user ${uid}`);
    return true;
  } catch (error) {
    console.error('Error removing admin claim:', error);
    throw error;
  }
};

// Check if user is admin
const isUserAdmin = async (uid) => {
  try {
    const idTokenResult = await firebaseAuth.currentUser.getIdTokenResult();
    return !!idTokenResult.claims.admin;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

export { 
  setAdminClaim,
  removeAdminClaim,
  isUserAdmin,
  db as adminDb
};