/** Suite / package version metadata used by builds and content checks. */
export const SUITE_VERSION = '0.1.0' as const;
export const CORE_PACKAGE_NAME = '@suite/core' as const;

export type VersionMetadata = {
  suiteVersion: typeof SUITE_VERSION;
  packageName: typeof CORE_PACKAGE_NAME;
  buildChannel: 'wiki-static';
};

export function getVersionMetadata(): VersionMetadata {
  return {
    suiteVersion: SUITE_VERSION,
    packageName: CORE_PACKAGE_NAME,
    buildChannel: 'wiki-static',
  };
}
