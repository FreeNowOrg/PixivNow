import { defineStore } from 'pinia'
import { pixivClient } from '@/api/pixiv-client'
import type { ArtworkInfo, User } from '@/types'
import { sortArtList } from '@/utils'

export const useUserProfileStore = defineStore('user-profile', () => {
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

  async function followUser(userId: string): Promise<void> {
    await pixivClient.followUser(userId)
    const cached = userCache.value.get(userId)
    if (cached) cached.isFollowed = true
  }

  async function unfollowUser(userId: string): Promise<void> {
    await pixivClient.unfollowUser(userId)
    const cached = userCache.value.get(userId)
    if (cached) cached.isFollowed = false
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
