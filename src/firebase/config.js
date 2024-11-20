const getEnvVar = (name) => {
  const value = import.meta.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is not set. Please check your .env file.`);
  }
  return value;
};

// Add detailed logging for debugging
const logEnvironmentStatus = () => {
  console.log('Environment Variables Status:');
  ['VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_PROJECT_ID', 
   'VITE_FIREBASE_STORAGE_BUCKET', 'VITE_FIREBASE_MESSAGING_SENDER_ID', 'VITE_FIREBASE_APP_ID']
    .forEach(varName => {
      console.log(`${varName}: ${import.meta.env[varName] ? 'Set' : 'Not Set'}`);
    });
};

export const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY'),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('VITE_FIREBASE_APP_ID'),
  experimentalForceLongPolling: true,
  experimentalAutoDetectLongPolling: true,
  retry: {
    maxAttempts: 5,
    delay: 1000
  }
};

// Validate config
export const validateConfig = () => {
  logEnvironmentStatus();
  
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  const missingFields = requiredFields.filter(field => !firebaseConfig[field]);
  
  if (missingFields.length > 0) {
    const error = new Error(`Missing required Firebase configuration fields: ${missingFields.join(', ')}\nPlease check your .env file and ensure all required variables are set.`);
    console.error('Firebase Configuration Error:', error);
    console.error('Current config:', {
      ...firebaseConfig,
      apiKey: firebaseConfig.apiKey ? '[REDACTED]' : undefined // Don't log the actual API key
    });
    throw error;
  }
  
  console.log('Firebase configuration validated successfully');
  return firebaseConfig;
};