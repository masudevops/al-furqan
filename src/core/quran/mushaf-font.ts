type LoadableFontFace = FontFace & { load: () => Promise<FontFace> };

type MushafFontDependencies = {
  createFontFace: (family: string, source: string) => LoadableFontFace;
  fonts: Pick<FontFaceSet, "add" | "load">;
};

export const mushafFontFamily = (pageNumber: number) => `qcf-p${pageNumber}-v4`;

export const mushafFontUrl = (pageNumber: number) =>
  `https://verses.quran.foundation/fonts/quran/hafs/v4/colrv1/woff2/p${pageNumber}.woff2`;

export const createMushafFontLoader = ({ createFontFace, fonts }: MushafFontDependencies) => {
  const pageLoads = new Map<number, Promise<boolean>>();

  return (pageNumber: number) => {
    const existingLoad = pageLoads.get(pageNumber);
    if (existingLoad) return existingLoad;

    const family = mushafFontFamily(pageNumber);
    const load = createFontFace(family, `url(${mushafFontUrl(pageNumber)})`)
      .load()
      .then(async (font) => {
        fonts.add(font);
        await fonts.load(`1em "${family}"`);
        return true;
      })
      .catch(() => false);

    pageLoads.set(pageNumber, load);
    void load.then((loaded) => {
      if (!loaded) pageLoads.delete(pageNumber);
    });
    return load;
  };
};

let browserLoader: ReturnType<typeof createMushafFontLoader> | null = null;

export const loadBrowserMushafFont = (pageNumber: number) => {
  if (typeof document === "undefined" || typeof FontFace === "undefined") return Promise.resolve(false);
  browserLoader ??= createMushafFontLoader({
    createFontFace: (family, source) => new FontFace(family, source, { display: "swap" }) as LoadableFontFace,
    fonts: document.fonts,
  });
  return browserLoader(pageNumber);
};
