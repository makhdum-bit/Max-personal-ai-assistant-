// Interfaces to type Google Calendar objects
export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  htmlLink?: string;
}

// 1. List calendar events
export async function listCalendarEvents(
  token: string,
  timeMin?: string,
  maxResults = 10
): Promise<GoogleCalendarEvent[]> {
  try {
    const minTime = timeMin || new Date().toISOString();
    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
      minTime
    )}&maxResults=${maxResults}&singleEvents=true&orderBy=startTime`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Google API returned status ${res.status}: ${errText}`);
    }

    const data: any = await res.json();
    return (data.items || []) as GoogleCalendarEvent[];
  } catch (error) {
    console.error("Error listing calendar events:", error);
    throw error;
  }
}

// 2. Create calendar event
export async function createCalendarEvent(
  token: string,
  eventData: {
    summary: string;
    description?: string;
    startTimeIso: string;
    endTimeIso: string;
    location?: string;
  }
): Promise<GoogleCalendarEvent> {
  try {
    const url = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
    
    const body = {
      summary: eventData.summary,
      description: eventData.description || "Generated via Max",
      location: eventData.location,
      start: {
        dateTime: eventData.startTimeIso,
      },
      end: {
        dateTime: eventData.endTimeIso,
      },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Google API returned status ${res.status}: ${errText}`);
    }

    const data: any = await res.json();
    return data as GoogleCalendarEvent;
  } catch (error) {
    console.error("Error creating calendar event:", error);
    throw error;
  }
}

// 3. Delete calendar event
export async function deleteCalendarEvent(token: string, eventId: string): Promise<void> {
  try {
    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(
      eventId
    )}`;

    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Google API returned status ${res.status}: ${errText}`);
    }
  } catch (error) {
    console.error("Error deleting calendar event:", error);
    throw error;
  }
}
