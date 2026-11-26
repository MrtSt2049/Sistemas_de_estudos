/**
 * OpenAPI generated types placeholder (ADR-08).
 * Regenerate via: npm run gen:types (with backend running at http://localhost:8000)
 */

export interface components {
  schemas: {
    ThemeEnum: "light" | "dark" | "system";
    UserProfile: {
      display_name: string;
      timezone: string;
      locale: string;
      theme: components["schemas"]["ThemeEnum"];
      daily_study_goal_minutes: number;
      week_starts_on: number;
      review_intervals_days: number[];
    };
    Me: {
      id: string;
      email: string;
      date_joined: string;
      profile: components["schemas"]["UserProfile"];
    };
    LoginRequest: {
      email: string;
      password: string;
    };
  };
}
