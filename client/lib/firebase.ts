import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  initializeAuth,
  browserSessionPersistence,
  Auth
} from 'firebase/auth';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ... config ...

let app: FirebaseApp;
let auth: Auth;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  if (Platform.OS === 'web') {
    auth = initializeAuth(app, {
      persistence: browserSessionPersistence,
    });
  } else {
    // We need to dynamic import or handle native persistence carefully
    // For now, let's fix the web crash
    auth = getAuth(app);
  }
} else {
  app = getApps()[0];
  auth = getAuth(app);
}

export { app, auth };
export default app;
