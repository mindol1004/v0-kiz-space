"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Heart, MessageCircle, MoreHorizontal, XCircle, Loader2, Send, Edit, Trash2 } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { Comment } from "../types/comment-types"
import { useLikeComment, useCreateReply, useDeleteComment, useUpdateComment } from "../hooks/use-comments"
import { useAuthStore } from "@/shared/stores/auth-store"

interface CommentItemProps {
  comment: Comment
  postId: string
}

export function CommentItem({ comment, postId }: CommentItemProps) {
  const { user } = useAuthStore()
  const [showReplyInput, setShowReplyInput] = useState(false)
  const [replyContent, setReplyContent] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null)
  const [editingReplyContent, setEditingReplyContent] = useState("")

  const likeCommentMutation = useLikeComment()
  const createReplyMutation = useCreateReply()
  const deleteCommentMutation = useDeleteComment()
  const updateCommentMutation = useUpdateComment()

  const handleLike = () => {
    likeCommentMutation.mutate(comment.id)
  }

  const handleReplySubmit = async () => {
    if (!replyContent.trim()) return

    try {
      await createReplyMutation.mutateAsync({
        parentId: comment.id,
        content: replyContent.trim(),
        postId
      })
      setReplyContent("")
      setShowReplyInput(false)
    } catch (error) {
      console.error("답글 작성 실패:", error)
    }
  }

  const handleDelete = () => {
    deleteCommentMutation.mutate(comment.id)
  }

  const handleEditSubmit = async () => {
    if (!editContent.trim()) return

    try {
      await updateCommentMutation.mutateAsync({
        commentId: comment.id,
        content: editContent.trim()
      })
      setIsEditing(false)
    } catch (error) {
      console.error("댓글 수정 실패:", error)
    }
  }

  const handleEditCancel = () => {
    setEditContent(comment.content)
    setIsEditing(false)
  }

  const handleReplyEditStart = (reply: Comment) => {
    setEditingReplyId(reply.id)
    setEditingReplyContent(reply.content)
  }

  const handleReplyEditSubmit = async (replyId: string) => {
    if (!editingReplyContent.trim()) return

    try {
      await updateCommentMutation.mutateAsync({
        commentId: replyId,
        content: editingReplyContent.trim()
      })
      setEditingReplyId(null)
      setEditingReplyContent("")
    } catch (error) {
      console.error("대댓글 수정 실패:", error)
    }
  }

  const handleReplyEditCancel = () => {
    setEditingReplyId(null)
    setEditingReplyContent("")
  }

  const isOwner = user?.id === comment.author.id

  return (
    <div className="space-y-3">
      <div className="flex space-x-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.author.avatar} />
          <AvatarFallback>{comment.author.nickname[0]}</AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-2">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-sm">{comment.author.nickname}</span>
              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Edit className="h-3 w-3 mr-2" />
                      수정
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                      삭제
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[60px] text-sm"
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEditCancel}
                    className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-500"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleEditSubmit}
                    disabled={!editContent.trim() || updateCommentMutation.isPending}
                    className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-500"
                  >
                    {updateCommentMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-700">{comment.content}</p>
            )}
          </div>

          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <span>{formatDate(new Date(comment.createdAt))}</span>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`flex items-center space-x-1 h-6 px-2 ${
                comment.isLiked ? "text-red-500" : "text-gray-500"
              }`}
            >
              <motion.div 
                whileTap={{ scale: 0.8 }} 
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Heart className={`h-3 w-3 ${comment.isLiked ? "fill-current" : ""}`} />
              </motion.div>
              <span>{comment.likesCount}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReplyInput(!showReplyInput)}
              className="flex items-center space-x-1 h-6 px-2 text-gray-500"
            >
              <MessageCircle className="h-3 w-3" />
              <span>답글</span>
            </Button>
          </div>

          {showReplyInput && user && (
            <div className="space-y-2">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="답글을 작성하세요..."
                className="min-h-[60px] text-sm"
              />
              <div className="flex justify-end space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowReplyInput(false)
                    setReplyContent("")
                  }}
                  className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-500"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={handleReplySubmit}
                  disabled={!replyContent.trim() || createReplyMutation.isPending}
                  className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-500"
                >
                  {createReplyMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 대댓글 목록 */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-11 space-y-3">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="flex space-x-3">
              <Avatar className="h-6 w-6">
                <AvatarImage src={reply.author.avatar} />
                <AvatarFallback>{reply.author.nickname[0]}</AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-1">
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-xs">{reply.author.nickname}</span>
                    {user?.id === reply.author.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-4 w-4 p-0">
                            <MoreHorizontal className="h-2 w-2" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleReplyEditStart(reply)}>
                            <Edit className="h-2 w-2 mr-1" />
                            수정
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => deleteCommentMutation.mutate(reply.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-2 w-2 mr-1" />
                            삭제
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  {editingReplyId === reply.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editingReplyContent}
                        onChange={(e) => setEditingReplyContent(e.target.value)}
                        className="min-h-[40px] text-xs"
                      />
                      <div className="flex justify-end space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleReplyEditCancel}
                          className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-500"
                        >
                          <XCircle className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleReplyEditSubmit(reply.id)}
                          disabled={!editingReplyContent.trim() || updateCommentMutation.isPending}
                          className="h-6 w-6 p-0 hover:bg-blue-50 hover:text-blue-500"
                        >
                          {updateCommentMutation.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Send className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-700">{reply.content}</p>
                  )}
                </div>

                <div className="flex items-center space-x-3 text-xs text-gray-500">
                  <span>{formatDate(new Date(reply.createdAt))}</span>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => likeCommentMutation.mutate(reply.id)}
                    className={`flex items-center space-x-1 h-5 px-1 ${
                      reply.isLiked ? "text-red-500" : "text-gray-500"
                    }`}
                  >
                    <motion.div 
                      whileTap={{ scale: 0.8 }} 
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <Heart className={`h-2 w-2 ${reply.isLiked ? "fill-current" : ""}`} />
                    </motion.div>
                    <span>{reply.likesCount}</span>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}