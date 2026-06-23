import { defineStore } from 'pinia'
import type { ArtworkInfo, User } from '~/types'
import { sortArtList } from '~/utils'

export const useUserProfileStore = defineStore('user-profile', () => {
  const pixivClient = usePixivClient()
  const userCache = ref(new Map<string, User>())

  function getCachedUser(id: string): User | undefined {
    return userCache.value.get(id)
  }

  async function fetchUser(id: string): Promise<User> {
    const cached = userCache.value.get(id)
    if (cached) return cached

    const [userData, profileData] = await Promise.all([
      pixivClient.getUser(id),
      pixivClient.getUserProfileTop(id),
    ])
    const userValue: User = {
      ...userData,
      illusts: sortArtList(profileData.illusts),
      manga: sortArtList(profileData.manga),
      novels: sortArtList(profileData.novels),
    }
    userCache.value.set(id, userValue)
    return userValue
  }

  async function fetchBookmarks(
    userId: string,
    params: { offset: number; hidden: boolean }
  ): Promise<{ works: ArtworkInfo[]; total: number }> {
    return pixivClient.getUserBookmarks(userId, {
      tag: '',
      offset: params.offset,
      limit: 48,
      rest: params.hidden ? 'hide' : 'show',
    })
  }

  // The optimistic UI toggle is owned by the calling component
  // (it flips isFollowed/following on the user object after the await).
  // Don't mutate the cached user here too, or the two writes cancel out
  // for users that are the same object as the component's reference.
  async function followUser(userId: string): Promise<void> {
    await pixivClient.followUser(userId)
  }

  async function unfollowUser(userId: string): Promise<void> {
    await pixivClient.unfollowUser(userId)
  }

  return {
    userCache,
    getCachedUser,
    fetchUser,
    fetchBookmarks,
    followUser,
    unfollowUser,
  }
})
