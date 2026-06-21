export interface SearchTextSegment {
  text: string;
  highlighted: boolean;
}

export function encodeSearchPathSegment(value: string): string {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

export function highlightLiteralText(
  text: string,
  query: string,
): SearchTextSegment[] {
  const literalQuery = query.trim();
  if (!literalQuery) {
    return [{ text, highlighted: false }];
  }

  const searchableText = text.toLocaleLowerCase();
  const searchableQuery = literalQuery.toLocaleLowerCase();
  const segments: SearchTextSegment[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const matchIndex = searchableText.indexOf(searchableQuery, cursor);
    if (matchIndex === -1) {
      segments.push({
        text: text.slice(cursor),
        highlighted: false,
      });
      break;
    }

    if (matchIndex > cursor) {
      segments.push({
        text: text.slice(cursor, matchIndex),
        highlighted: false,
      });
    }

    const matchEnd = matchIndex + literalQuery.length;
    segments.push({
      text: text.slice(matchIndex, matchEnd),
      highlighted: true,
    });
    cursor = matchEnd;
  }

  return segments.length > 0
    ? segments
    : [{ text, highlighted: false }];
}
