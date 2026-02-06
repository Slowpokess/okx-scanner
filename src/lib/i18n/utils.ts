export function interpolate(template: string, params: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key]?.toString() || match
  })
}

export function getTranslationByPath(obj: any, path: string): string {
  return path.split('.').reduce((current, key) => current?.[key], obj) || path
}
