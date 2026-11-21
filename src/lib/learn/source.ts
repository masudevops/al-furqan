import { QAIDAH_LESSONS, type QaidahLesson } from "./curriculum";

// Where lesson content comes from. Today it is the local draft curriculum; a licensed Qaidah API or self-hosted
// lesson JSON + audio (e.g. on Azure Blob Storage) can implement this same interface later without touching the UI.
// See docs/LEARN-QAIDAH.md ("Introducing an API later").
export interface QaidahContentSource {
  id: string;
  label: string;
  lessons(): Promise<readonly QaidahLesson[]>;
}

export const localQaidahSource: QaidahContentSource = {
  id: "local-draft",
  label: "Al-Furqan draft curriculum (awaiting qualified review)",
  lessons: async () => QAIDAH_LESSONS,
};
