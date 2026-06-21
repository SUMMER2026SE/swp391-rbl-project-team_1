import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../prisma/client';
import { ApiError } from '../utils/apiError';
import { z } from 'zod';

// Enums manually mapped from Prisma to avoid import issues if not generated
const PostStatus = {
  PENDING: 'PENDING',
  PUBLISHED: 'PUBLISHED',
  REJECTED: 'REJECTED'
} as const;

const createPostSchema = z.object({
  title: z.string().min(5, 'Tiêu đề phải từ 5 ký tự'),
  content: z.string().min(10, 'Nội dung phải từ 10 ký tự'),
  type: z.enum(['QUESTION', 'EXPERIENCE', 'ROADMAP_FEEDBACK']),
  skillIds: z.array(z.string()).optional(),
  attachedRoadmapId: z.string().optional().nullable()
});

/**
 * [Student] Create a new community post
 */
export async function createPost(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.studentId;
    if (!studentId) throw new ApiError(400, 'Không tìm thấy thông tin Student.');

    const data = createPostSchema.parse(req.body);

    const post = await prisma.communityPost.create({
      data: {
        authorId: studentId,
        title: data.title,
        content: data.content,
        type: data.type as any,
        status: PostStatus.PENDING as any,
        attachedRoadmapId: data.attachedRoadmapId || null,
        skillTags: data.skillIds && data.skillIds.length > 0 ? {
          connect: data.skillIds.map(id => ({ id }))
        } : undefined
      },
      include: {
        skillTags: true
      }
    });

    res.status(201).json({ success: true, post });
  } catch (error) {
    next(error);
  }
}

/**
 * [Public/Guest/Student] Get all published posts
 */
export async function getPublishedPosts(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { type, skillId, sortBy, search } = req.query;

    const where: any = { status: PostStatus.PUBLISHED };

    if (type) where.type = type as any;
    if (skillId) {
      where.skillTags = {
        some: { id: String(skillId) }
      };
    }
    if (search) {
      where.title = {
        contains: String(search),
        mode: 'insensitive'
      };
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'upvotes') {
      orderBy = { upvoteCount: 'desc' };
    } else if (sortBy === 'comments') {
      orderBy = { comments: { _count: 'desc' } };
    }

    const posts = await prisma.communityPost.findMany({
      where,
      orderBy,
      include: {
        author: {
          include: { user: { select: { fullName: true, avatarUrl: true } } }
        },
        skillTags: true,
        _count: {
          select: { comments: true }
        }
      }
    });

    res.status(200).json({ success: true, posts });
  } catch (error) {
    next(error);
  }
}

/**
 * [Public/Guest/Student] Get post details
 */
export async function getPostDetails(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    const post = await prisma.communityPost.findUnique({
      where: { id },
      include: {
        author: {
          include: { user: { select: { fullName: true, avatarUrl: true } } }
        },
        skillTags: true,
        upvotedBy: {
          select: { id: true }
        },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              include: { user: { select: { fullName: true, avatarUrl: true } } }
            }
          }
        }
      }
    });

    if (!post) throw new ApiError(404, 'Không tìm thấy bài đăng.');

    res.status(200).json({ success: true, post });
  } catch (error) {
    next(error);
  }
}

/**
 * [Student] Get my posts
 */
export async function getMyPosts(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.studentId;
    if (!studentId) throw new ApiError(400, 'Không tìm thấy thông tin Student.');

    const posts = await prisma.communityPost.findMany({
      where: { authorId: studentId },
      orderBy: { createdAt: 'desc' },
      include: {
        skillTags: true,
        _count: {
          select: { comments: true }
        }
      }
    });

    res.status(200).json({ success: true, posts });
  } catch (error) {
    next(error);
  }
}

/**
 * [Student] Add a comment
 */
const commentSchema = z.object({
  content: z.string().min(1, 'Nội dung bình luận không được bỏ trống')
});

export async function addComment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.studentId;
    if (!studentId) throw new ApiError(400, 'Không tìm thấy thông tin Student.');
    const { id: postId } = req.params;
    const { content } = commentSchema.parse(req.body);

    const post = await prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post || post.status !== PostStatus.PUBLISHED) {
      throw new ApiError(404, 'Bài đăng không tồn tại hoặc chưa được duyệt.');
    }

    const comment = await prisma.postComment.create({
      data: {
        postId,
        authorId: studentId,
        content
      },
      include: {
        author: {
          include: { user: { select: { fullName: true, avatarUrl: true } } }
        }
      }
    });

    res.status(201).json({ success: true, comment });
  } catch (error) {
    next(error);
  }
}

/**
 * [Student] Upvote a post
 */
export async function upvotePost(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.studentId;
    if (!studentId) throw new ApiError(400, 'Không tìm thấy thông tin Student.');
    const { id } = req.params;

    const post = await prisma.communityPost.findUnique({
      where: { id },
      include: { upvotedBy: { where: { id: studentId } } }
    });

    if (!post) throw new ApiError(404, 'Bài đăng không tồn tại.');

    const hasUpvoted = post.upvotedBy.length > 0;

    let updatedPost;
    if (hasUpvoted) {
      // Bỏ upvote
      updatedPost = await prisma.communityPost.update({
        where: { id },
        data: {
          upvoteCount: { decrement: 1 },
          upvotedBy: { disconnect: { id: studentId } }
        }
      });
    } else {
      // Thêm upvote
      updatedPost = await prisma.communityPost.update({
        where: { id },
        data: {
          upvoteCount: { increment: 1 },
          upvotedBy: { connect: { id: studentId } }
        }
      });
    }

    res.status(200).json({ success: true, upvoteCount: updatedPost.upvoteCount, hasUpvoted: !hasUpvoted });
  } catch (error) {
    next(error);
  }
}

/**
 * [Student] Report a comment
 */
export async function reportComment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    await prisma.postComment.update({
      where: { id },
      data: { reportCount: { increment: 1 } }
    });

    res.status(200).json({ success: true, message: 'Đã báo cáo bình luận.' });
  } catch (error) {
    next(error);
  }
}

// ================= MODERATION (Admin/Mentor) =================

/**
 * [Admin/Mentor] Get pending posts
 */
export async function getPendingPosts(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const posts = await prisma.communityPost.findMany({
      where: { status: PostStatus.PENDING },
      orderBy: { createdAt: 'asc' },
      include: {
        author: {
          include: { user: { select: { fullName: true, email: true } } }
        },
        skillTags: true
      }
    });

    res.status(200).json({ success: true, posts });
  } catch (error) {
    next(error);
  }
}

/**
 * [Admin/Mentor] Approve or Reject a post
 */
const reviewSchema = z.object({
  status: z.enum(['PUBLISHED', 'REJECTED']),
  rejectReason: z.string().optional()
});

export async function reviewPost(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const reviewerId = req.user?.id;
    const data = reviewSchema.parse(req.body);

    if (data.status === 'REJECTED' && !data.rejectReason) {
      throw new ApiError(400, 'Cần cung cấp lý do từ chối.');
    }

    const post = await prisma.communityPost.update({
      where: { id },
      data: {
        status: data.status as any,
        rejectReason: data.status === 'REJECTED' ? data.rejectReason : null,
        reviewedBy: reviewerId,
        reviewedAt: new Date()
      }
    });

    // Create an alert for the author
    const alertMessage = data.status === 'PUBLISHED' 
      ? `Bài đăng "${post.title}" của bạn đã được duyệt và hiển thị công khai.`
      : `Bài đăng "${post.title}" của bạn đã bị từ chối với lý do: ${data.rejectReason}`;
    
    await prisma.alert.create({
      data: {
        studentId: post.authorId,
        type: data.status === 'PUBLISHED' ? 'SYSTEM_INFO' : 'YELLOW_WARNING',
        message: alertMessage
      }
    });

    res.status(200).json({ success: true, post });
  } catch (error) {
    next(error);
  }
}

/**
 * [Admin/Mentor] Get reported comments
 */
export async function getReportedComments(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const comments = await prisma.postComment.findMany({
      where: { reportCount: { gte: 1 } },
      orderBy: { reportCount: 'desc' },
      include: {
        author: {
          include: { user: { select: { fullName: true, email: true } } }
        },
        post: {
          select: { id: true, title: true }
        }
      }
    });

    res.status(200).json({ success: true, comments });
  } catch (error) {
    next(error);
  }
}

/**
 * [Admin/Mentor] Resolve reported comment (reset reportCount to 0)
 */
export async function resolveReportedComment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    await prisma.postComment.update({
      where: { id },
      data: { reportCount: 0 }
    });

    res.status(200).json({ success: true, message: 'Đã bỏ qua báo cáo cho bình luận này.' });
  } catch (error) {
    next(error);
  }
}

/**
 * [Admin/Mentor] Delete comment
 */
export async function deleteComment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    await prisma.postComment.delete({
      where: { id }
    });

    res.status(200).json({ success: true, message: 'Đã xóa bình luận vi phạm.' });
  } catch (error) {
    next(error);
  }
}
