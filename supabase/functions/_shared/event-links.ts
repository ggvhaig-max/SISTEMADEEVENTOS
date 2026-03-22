export function getAppBaseUrl(): string {
  return (Deno.env.get('APP_URL') || 'https://suerte.dolaritoganador.com').replace(/\/$/, '');
}

export function getEventLandingUrl(eventoSlug: string): string {
  const baseUrl = getAppBaseUrl();
  return eventoSlug ? `${baseUrl}/evento/${eventoSlug}` : baseUrl;
}

export function getEventLookupUrl(eventoSlug: string): string {
  const landingUrl = getEventLandingUrl(eventoSlug);
  return `${landingUrl}?tab=consultar`;
}
