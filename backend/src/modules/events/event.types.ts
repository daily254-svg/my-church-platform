export interface EventRegistrationField {
  key: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'textarea' | 'number';
  required: boolean;
  placeholder?: string;
}

export interface EventRegistrationPayload {
  eventId: string;
  answers: Record<string, string | number | boolean | null>;
}
