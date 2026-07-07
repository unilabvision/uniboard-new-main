export type EventType = 'workshop' | 'seminar' | 'conference' | 'meetup' | 'webinar';
export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export interface MyuniEvent {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  organizer_name: string | null;
  organizer_email: string | null;
  organizer_linkedin: string | null;
  organizer_image_url: string | null;
  event_type: EventType;
  category: string | null;
  tags: string[] | null;
  start_date: string;
  end_date: string | null;
  timezone: string;
  duration_minutes: number | null;
  is_online: boolean;
  location_name: string | null;
  location_address: string | null;
  meeting_url: string | null;
  is_paid: boolean;
  price: number | null;
  max_attendees: number | null;
  current_attendees: number;
  registration_deadline: string | null;
  is_registration_open: boolean;
  thumbnail_url: string | null;
  banner_url: string | null;
  status: EventStatus;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export type MyuniEventInput = Partial<
  Omit<MyuniEvent, 'id' | 'current_attendees' | 'created_at' | 'updated_at'>
> & {
  slug: string;
  title: string;
  start_date: string;
};
