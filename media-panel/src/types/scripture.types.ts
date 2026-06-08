export interface ScriptureReference {
  book: string
  chapter: number
  verse: number
  version?: string
}

export interface BibleVersionMeta {
  id: string
  abbreviation: string
  name: string
  available: boolean
}

export interface VersionsResponse {
  success: boolean
  count: number
  versions: BibleVersionMeta[]
}