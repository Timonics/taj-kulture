export function extractPublicId(url: string): string {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z]+$/);
  return match ? match[1] : '';
}
