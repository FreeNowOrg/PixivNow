import { Artwork } from './Artworks'

export type UserPrivacyLevel = '0' | '1' | '2'

export interface User {
  userId: `${number}`
  name: string
  image: string
  imageBig: string
  premium: boolean
  isFollowed: boolean
  isMypixiv: boolean
  isBlocking: boolean
  background: {} | null
  sketchLiveId: {} | null
  partial: number
  acceptRequest: boolean
  sketchLives: any[]
  following: number
  followedBack: boolean
  comment: string
  commentHtml: string
  webpage: string | null
  social: any[]
  region: {
    name: string
    privacyLevel: UserPrivacyLevel
  } | null
  birthDay: {
    name: string
    privacyLevel: UserPrivacyLevel
  } | null
  gender: {
    name: string
    privacyLevel: UserPrivacyLevel
  } | null
  job: {
    name: string
    privacyLevel: UserPrivacyLevel
  } | null
  workspace: {
    userWorkspacePc: string
    userWorkspaceMonitor: string
    userWorkspaceTool: string
    userWorkspaceScanner: string
    userWorkspaceTablet: string
    userWorkspaceMouse: string
    userWorkspacePrinter: string
    userWorkspaceDesktop: string
    userWorkspaceMusic: string
    userWorkspaceDesk: string
    userWorkspaceChair: string
  }
  official: boolean
  group: null
  illusts: Artwork[]
  novels: Artwork[]
}
