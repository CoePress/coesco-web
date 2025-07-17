// Universal mapping utility for backend-to-frontend data transformation

export type MappingConfig = {
  [backendKey: string]: string | { key: string, transform?: (val: any, backend?: any) => any }
};

export function mapBackendToFrontend<T = any>(
  backendData: any,
  mapping: MappingConfig,
  extra?: (backend: any, partial: Partial<T>) => Partial<T>
): T {
  const result: any = {};
  for (const [backendKey, frontendKeyOrObj] of Object.entries(mapping)) {
    if (backendData[backendKey] !== undefined) {
      if (typeof frontendKeyOrObj === 'string') {
        result[frontendKeyOrObj] = backendData[backendKey];
      } else {
        const { key, transform } = frontendKeyOrObj;
        result[key] = transform ? transform(backendData[backendKey], backendData) : backendData[backendKey];
      }
    }
  }
  // Allow for extra custom logic (for nested/complex fields)
  return extra ? { ...result, ...extra(backendData, result) } : result;
} 