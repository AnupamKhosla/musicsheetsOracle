const MANAGED_INDICATORS = [
  'VERCEL',
  'CF_PAGES',
  'K_SERVICE',
  'FUNCTION_NAME',
  'AWS_LAMBDA_FUNCTION_NAME',
  'RAILWAY_SERVICE_ID',
  'RENDER_SERVICE_ID',
  'FLY_APP_NAME',
  'DYNO',
  'REPL_ID',
  'CODESANDBOX_SSE',
] as const;

export function isManagedPlatform(): boolean {
  return MANAGED_INDICATORS.some(k => process.env[k] !== undefined);
}
