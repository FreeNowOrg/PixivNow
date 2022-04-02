export interface Comments {
  userId: `${number}`
  userName: string
  isDeletedUser: boolean
  img: string
  id: `${number}`
  comment: string
  stampId: number | null
  stampLink: null
  commentDate: string
  commentRootId: string | null
  commentParentId: string | null
  commentUserId: `${number}`
  replyToUserId: string | null
  replyToUserName: string | null
  editable: boolean
  hasReplies: boolean
}
