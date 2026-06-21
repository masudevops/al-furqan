import { createReadingContinuityRepository } from "../../core/quran/readingContinuity";

export function getWebReadingContinuityRepository() {
  return createReadingContinuityRepository(window.localStorage);
}
