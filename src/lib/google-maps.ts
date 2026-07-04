/** Builds a Google Maps "write review" URL when a Place ID is configured. */
export function buildGoogleReviewUrl(placeId: string): string {
  const trimmed = placeId.trim();
  if (!trimmed) return "";
  return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(trimmed)}`;
}
