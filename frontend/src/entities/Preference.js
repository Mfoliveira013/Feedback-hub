import { get, put } from "@/api/httpClient";

export const Preference = {
  async me() {
    return get("/preferences/me");
  },

  async updateMyPreferences(patch) {
    return put("/preferences/me", patch);
  },
};

