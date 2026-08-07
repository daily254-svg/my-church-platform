import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../constants";

export interface EventRegistrationField {
  key: string;
  label: string;
  type: "text" | "email" | "tel" | "textarea" | "number";
  required: boolean;
  placeholder?: string;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  type: string;
  accent: string;
  acceptRegistration?: boolean;
  registrationTitle?: string | null;
  registrationDescription?: string | null;
  registrationFields?: EventRegistrationField[];
  createdAt: string;
}

const TOKEN_KEY = "auth_token";

export const eventService = {
  async getAll(): Promise<Event[]> {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    
    const res = await fetch(`${API_URL}/events`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const json = await res.json();
    if (!json.success) {
      throw new Error(json.message || "Failed to fetch events");
    }
    return json.data as Event[];
  },

  async register(eventId: string, answers: Record<string, string | number | boolean | null>): Promise<void> {
    const token = await AsyncStorage.getItem(TOKEN_KEY);

    const res = await fetch(`${API_URL}/events/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ eventId, answers }),
    });

    const json = await res.json();
    if (!json.success) {
      throw new Error(json.message || "Failed to register for event");
    }
  },
};