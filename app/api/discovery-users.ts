import type { ArtworkInfo, NovelInfo, UserListItem } from '~/types'

export interface DiscoveryUsersBody {
  recommendedUsers: {
    userId: string
    recentIllustIds: string[]
    recentNovelIds: string[]
  }[]
  users: {
    userId: `${number}`
    name: string
    image: string
    comment: string
    isFollowed: boolean
    followedBack: boolean
    isMypixiv: boolean
    isBlocking: boolean
    commission?: { acceptRequest: boolean } | null
  }[]
  thumbnails: {
    illust?: ArtworkInfo[]
    novel?: NovelInfo[]
  }
}

// Join the relational discovery/users payload into the denormalized
// UserListItem shape consumed by FollowUserCard.
export function buildDiscoveryUsers(body: DiscoveryUsersBody): UserListItem[] {
  const userMap = new Map(body.users.map((u) => [u.userId, u]))
  const illustMap = new Map((body.thumbnails.illust ?? []).map((i) => [i.id, i]))
  const novelMap = new Map((body.thumbnails.novel ?? []).map((n) => [n.id, n]))

  const result: UserListItem[] = []
  for (const rec of body.recommendedUsers) {
    const u = userMap.get(rec.userId as `${number}`)
    if (!u) continue
    result.push({
      userId: u.userId,
      userName: u.name,
      profileImageUrl: u.image,
      userComment: u.comment,
      following: u.isFollowed,
      followed: u.followedBack,
      isBlocking: u.isBlocking,
      isMypixiv: u.isMypixiv,
      illusts: rec.recentIllustIds
        .map((id) => illustMap.get(id as `${number}`))
        .filter((x): x is ArtworkInfo => !!x),
      novels: rec.recentNovelIds
        .map((id) => novelMap.get(id as `${number}`))
        .filter((x): x is NovelInfo => !!x),
      acceptRequest: u.commission?.acceptRequest ?? false,
    })
  }
  return result
}
