export type ReleaseChannel='development'|'beta'|'stable'

export const buildMetadata=__APP_METADATA__

export function releaseChannel(version:string,mode:string):ReleaseChannel{
  if(mode!=='production')return'development'
  return version.includes('-')?'beta':'stable'
}
