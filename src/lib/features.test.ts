import { describe, expect, it } from "vitest";

import { resolvePublicFeatures } from "./features";

describe("public feature flags", () => {
  it("keeps stable features on and Qibla off by default", () => {
    expect(resolvePublicFeatures({})).toEqual({
      salahTimes: true,
      dua: true,
      qibla: false,
      masjidFinder: true,
      learn: false,
    });
  });

  it("honors explicit true and false values case-insensitively", () => {
    expect(resolvePublicFeatures({
      NEXT_PUBLIC_FEATURE_SALAH_TIMES: "FALSE",
      NEXT_PUBLIC_FEATURE_DUA: "false",
      NEXT_PUBLIC_FEATURE_QIBLA: "true",
      NEXT_PUBLIC_FEATURE_MASJID_FINDER: "false",
      NEXT_PUBLIC_FEATURE_LEARN: "true",
    })).toEqual({
      salahTimes: false,
      dua: false,
      qibla: true,
      masjidFinder: false,
      learn: true,
    });
  });
});
