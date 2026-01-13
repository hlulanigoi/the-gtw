import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { API_URL } from '@/lib/api';

const LOCATION_TASK_NAME = 'background-location-tracking';
const UPDATE_INTERVAL = 30000; // 30 seconds

interface LocationUpdate {
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

// Define the background task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
  if (error) {
    console.error('Background location task error:', error);
    return;
  }
  if (data) {
    const { locations } = data;
    if (locations && locations.length > 0) {
      const location = locations[0];
      // Location data will be sent to server
      console.log('Background location update:', location.coords);
    }
  }
});

export class BackgroundLocationService {
  private static instance: BackgroundLocationService;
  private isTracking: boolean = false;
  private currentParcelId: string | null = null;
  private authToken: string | null = null;
  private updateTimer: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): BackgroundLocationService {
    if (!BackgroundLocationService.instance) {
      BackgroundLocationService.instance = new BackgroundLocationService();
    }
    return BackgroundLocationService.instance;
  }

  /**
   * Start tracking location for a parcel
   */
  async startTracking(parcelId: string, authToken: string): Promise<void> {
    if (this.isTracking && this.currentParcelId === parcelId) {
      console.log('Already tracking this parcel');
      return;
    }

    try {
      // Request permissions
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        throw new Error('Foreground location permission not granted');
      }

      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        console.warn('Background location permission not granted, using foreground only');
      }

      this.currentParcelId = parcelId;
      this.authToken = authToken;
      this.isTracking = true;

      // Start background location tracking if permission is granted
      if (backgroundStatus === 'granted') {
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
          accuracy: Location.Accuracy.High,
          timeInterval: UPDATE_INTERVAL,
          distanceInterval: 50, // Update every 50 meters
          foregroundService: {
            notificationTitle: 'Parcel Delivery in Progress',
            notificationBody: 'Tracking your location for delivery',
            notificationColor: '#FF6B35',
          },
        });
      }

      // Start foreground updates as fallback
      this.startForegroundTracking();

      console.log('Location tracking started for parcel:', parcelId);
    } catch (error) {
      console.error('Failed to start location tracking:', error);
      throw error;
    }
  }

  /**
   * Start foreground location tracking
   */
  private startForegroundTracking(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }

    this.updateTimer = setInterval(async () => {
      if (!this.isTracking || !this.currentParcelId || !this.authToken) {
        return;
      }

      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        await this.sendLocationUpdate({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy || undefined,
          speed: location.coords.speed || undefined,
          heading: location.coords.heading || undefined,
        });
      } catch (error) {
        console.error('Failed to get location:', error);
      }
    }, UPDATE_INTERVAL);
  }

  /**
   * Send location update to server
   */
  private async sendLocationUpdate(location: LocationUpdate): Promise<void> {
    if (!this.currentParcelId || !this.authToken) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/parcels/${this.currentParcelId}/location`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(location),
        }
      );

      if (!response.ok) {
        console.error('Failed to send location update:', await response.text());
      } else {
        console.log('Location update sent successfully');
      }
    } catch (error) {
      console.error('Error sending location update:', error);
    }
  }

  /**
   * Stop tracking location
   */
  async stopTracking(): Promise<void> {
    if (!this.isTracking) {
      console.log('Not currently tracking');
      return;
    }

    try {
      // Stop background tracking
      const hasStarted = await Location.hasStartedLocationUpdatesAsync(
        LOCATION_TASK_NAME
      );
      if (hasStarted) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      }

      // Stop foreground tracking
      if (this.updateTimer) {
        clearInterval(this.updateTimer);
        this.updateTimer = null;
      }

      this.isTracking = false;
      this.currentParcelId = null;
      this.authToken = null;

      console.log('Location tracking stopped');
    } catch (error) {
      console.error('Failed to stop location tracking:', error);
      throw error;
    }
  }

  /**
   * Check if currently tracking
   */
  isCurrentlyTracking(): boolean {
    return this.isTracking;
  }

  /**
   * Get current parcel being tracked
   */
  getCurrentParcelId(): string | null {
    return this.currentParcelId;
  }

  /**
   * Send a single location update manually
   */
  async sendManualUpdate(
    parcelId: string,
    authToken: string
  ): Promise<void> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const response = await fetch(
        `${API_URL}/parcels/${parcelId}/location`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy || undefined,
            speed: location.coords.speed || undefined,
            heading: location.coords.heading || undefined,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to send location update');
      }

      console.log('Manual location update sent successfully');
    } catch (error) {
      console.error('Failed to send manual location update:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const backgroundLocationService = BackgroundLocationService.getInstance();
