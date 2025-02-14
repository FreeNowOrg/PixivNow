import type { NumberString } from './index'

export interface Comments {
  userId: NumberString
  userName: string
  isDeletedUser: boolean
  img: string
  id: NumberString
  comment: string
  stampId: number | null
  stampLink: null
  commentDate: string
  commentRootId: string | null
  commentParentId: string | null
  commentUserId: NumberString
  replyToUserId: string | null
  replyToUserName: string | null
  editable: boolean
  hasReplies: boolean
}
