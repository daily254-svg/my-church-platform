import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../constants";
import * as ImagePicker from 'expo-image-picker';

const TOKEN_KEY = "auth_token";

export const profilePictureService = {
  async pickAndUpload(): Promise<string | null> {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permission to access media library was denied');
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]) {
        return null;
      }

      // Upload to server
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const formData = new FormData();
      
      formData.append('avatar', {
        uri: result.assets[0].uri,
        type: 'image/jpeg',
        name: 'avatar.jpg',
      } as any);

      const response = await fetch(`${API_URL}/auth/avatar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Upload failed');
      }

      const avatarUrl: string = data.data.avatarUrl;
      if (avatarUrl.startsWith("http")) {
        return avatarUrl;
      }
      return `${API_URL}${avatarUrl}`;
    } catch (err) {
      console.warn('[profile-picture] Upload failed:', err);
      throw err;
    }
  },

  getFullUrl(avatarUrl: string | null): string {
    if (!avatarUrl) {
      return `https://ui-avatars.com/api/?name=User&background=1B3A7A&color=fff&size=200`;
    }
    if (avatarUrl.startsWith('http')) {
      return avatarUrl;
    }
    return `${API_URL}${avatarUrl}`;
  },
};