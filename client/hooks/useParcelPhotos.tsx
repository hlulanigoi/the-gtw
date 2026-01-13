import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { API_URL } from '@/lib/api';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

export interface ParcelPhoto {
  id: string;
  parcelId: string;
  uploadedBy: string;
  photoUrl: string;
  photoType: 'parcel' | 'pickup' | 'delivery';
  caption: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: Date;
}

export function useParcelPhotos(parcelId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch parcel photos
  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['parcel-photos', parcelId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/parcels/${parcelId}/photos`);
      if (!response.ok) throw new Error('Failed to fetch photos');
      return response.json();
    },
  });

  // Upload photo
  const uploadPhotoMutation = useMutation({
    mutationFn: async ({
      photoData,
      photoType,
      caption,
    }: {
      photoData: string;
      photoType: 'parcel' | 'pickup' | 'delivery';
      caption?: string;
    }) => {
      if (!user) throw new Error('User not authenticated');
      const token = await user.getIdToken();

      // Get current location
      let latitude: number | null = null;
      let longitude: number | null = null;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          latitude = location.coords.latitude;
          longitude = location.coords.longitude;
        }
      } catch (error) {
        console.log('Location not available:', error);
      }

      const response = await fetch(`${API_URL}/parcels/${parcelId}/photos/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          photoData,
          photoType,
          caption,
          latitude,
          longitude,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload photo');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parcel-photos', parcelId] });
      queryClient.invalidateQueries({ queryKey: ['parcels'] });
    },
  });

  // Capture photo
  const capturePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Camera permission not granted');
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      return `data:image/jpeg;base64,${asset.base64}`;
    }
    return null;
  };

  return {
    photos,
    isLoading,
    uploadPhoto: uploadPhotoMutation.mutateAsync,
    capturePhoto,
    isUploading: uploadPhotoMutation.isPending,
  };
}
