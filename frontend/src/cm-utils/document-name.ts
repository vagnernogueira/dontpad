export const trimTrailingSlashes = (value: string): string => {
  return value.replace(/\/+$/g, '')
}
