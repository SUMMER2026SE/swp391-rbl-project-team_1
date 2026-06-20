import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware';
import { verifyRole } from '../middleware/role.middleware';
import { Role } from '../types/enums';
import {
  createPost,
  getPublishedPosts,
  getPostDetails,
  getMyPosts,
  addComment,
  upvotePost,
  reportComment,
  getPendingPosts,
  reviewPost,
  getReportedComments,
  resolveReportedComment,
  deleteComment
} from '../controllers/community.controller';

const router = Router();

// ================= PUBLIC / GUEST =================
// Actually let's just make viewing public but require auth for creation/commenting
// Or we can just require verifyToken for everything except getting published posts
// Since requirement: "Guest xem được, Student mới được bình luận/upvote"
router.get('/posts', getPublishedPosts);
router.get('/posts/:id', getPostDetails);

// ================= STUDENT ACTIONS =================
// All actions below require authentication
router.use(verifyToken);

router.get('/my-posts', verifyRole(Role.STUDENT), getMyPosts);
router.post('/posts', verifyRole(Role.STUDENT), createPost);
router.post('/posts/:id/comments', verifyRole(Role.STUDENT), addComment);
router.post('/posts/:id/upvote', verifyRole(Role.STUDENT), upvotePost);
router.post('/comments/:id/report', verifyRole(Role.STUDENT), reportComment);

// ================= MODERATION =================
// Requires ADMIN or MENTOR
router.get('/moderation/pending', verifyRole(Role.ADMIN, Role.MENTOR), getPendingPosts);
router.put('/moderation/:id/review', verifyRole(Role.ADMIN, Role.MENTOR), reviewPost);

router.get('/moderation/reported-comments', verifyRole(Role.ADMIN, Role.MENTOR), getReportedComments);
router.put('/moderation/comments/:id/resolve', verifyRole(Role.ADMIN, Role.MENTOR), resolveReportedComment);
router.delete('/moderation/comments/:id', verifyRole(Role.ADMIN, Role.MENTOR), deleteComment);

export default router;
