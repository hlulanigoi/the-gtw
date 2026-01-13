import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { backgroundLocationService } from '@/lib/background-location';

export function useBackgroundLocation() {
  const { user } = useAuth();
  const [isTracking, setIsTracking] = useState(false);
  const [currentParcelId, setCurrentParcelId] = useState<string | null>(null);

  useEffect(() => {
    // Check tracking status on mount
    setIsTracking(backgroundLocationService.isCurrentlyTracking());
    setCurrentParcelId(backgroundLocationService.getCurrentParcelId());
  }, []);

  const startTracking = async (parcelId: string): Promise<boolean> => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to start tracking');
      return false;
    }

    try {
      const token = await user.getIdToken();
      await backgroundLocationService.startTracking(parcelId, token);
      setIsTracking(true);
      setCurrentParcelId(parcelId);
      return true;
    } catch (error: any) {
      Alert.alert(
        'Location Permission Required',
        'Please enable location permissions to track delivery. You can enable it in Settings > ParcelPeer > Location.',
        [{ text: 'OK' }]
      );
      return false;
    }
  };

  const stopTracking = async (): Promise<boolean> => {
    try {
      await backgroundLocationService.stopTracking();
      setIsTracking(false);
      setCurrentParcelId(null);
      return true;
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to stop tracking');
      return false;
    }
  };

  const sendManualUpdate = async (parcelId: string): Promise<boolean> => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to send location update');
      return false;
    }

    try {
      const token = await user.getIdToken();
      await backgroundLocationService.sendManualUpdate(parcelId, token);
      return true;
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send location update');
      return false;
    }
  };

  return {
    isTracking,
    currentParcelId,
    startTracking,
    stopTracking,
    sendManualUpdate,
  };
}
