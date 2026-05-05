/**
 * Communication preferences & push token registration
 */

import { api } from "@/lib/api-client";

export interface CommunicationPreferences {
  user_id: string;
  checkin_push_enabled: boolean;
  quiet_hours_start: number | null;
  quiet_hours_end: number | null;
  workdays_only: boolean;
  max_checkins_per_day: number;
  missed_followup_hours: number;
  push_achievements: boolean;
  push_streaks: boolean;
  push_nudges: boolean;
  email_digest: boolean;
  email_urgent_only: boolean;
  checkin_miss_count_by_hour: Record<string, number>;
}

export type CommunicationPreferencesUpdate = Partial<
  Omit<CommunicationPreferences, "user_id" | "checkin_miss_count_by_hour">
>;

export const communicationService = {
  async getPreferences() {
    return api.get<CommunicationPreferences>("/communication/preferences");
  },

  async updatePreferences(body: CommunicationPreferencesUpdate) {
    return api.put<CommunicationPreferences>("/communication/preferences", body);
  },

  async registerPushToken(token: string, platform: "ios" | "android" | "web" = "web") {
    return api.post<{ registered: boolean }>("/communication/push-tokens", { token, platform });
  },

  async revokePushToken(token: string) {
    return api.post<{ removed: boolean }>("/communication/push-tokens/revoke", { token });
  },
};
