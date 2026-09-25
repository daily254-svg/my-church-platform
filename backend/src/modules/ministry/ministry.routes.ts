import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';
import {
  createGroup,
  updateGroup,
  deleteGroup,
  getAllGroups,
  getUserGroups,
  joinGroup,
  leaveGroup,
  getGroupMessages,
  sendMessage,
} from './ministry.controller';

const router = Router();

// GET /api/ministry
router.get('/', authenticate, getAllGroups);

// POST /api/ministry — authenticate, authorize ADMIN/PASTOR, create ministry
router.post('/', authenticate, authorize(['ADMIN', 'PASTOR']), createGroup);

// GET /api/ministry/my
router.get('/my', authenticate, getUserGroups);

// POST /api/ministry/:groupId/join
router.post('/:groupId/join', authenticate, joinGroup);

// DELETE /api/ministry/:groupId/leave
router.delete('/:groupId/leave', authenticate, leaveGroup);

// GET /api/ministry/:groupId/messages
router.get('/:groupId/messages', authenticate, getGroupMessages);

// POST /api/ministry/:groupId/messages
router.post('/:groupId/messages', authenticate, sendMessage);

// PATCH /api/ministry/:groupId — authenticate, authorize ADMIN/PASTOR, update ministry
router.patch('/:groupId', authenticate, authorize(['ADMIN', 'PASTOR']), updateGroup);

// DELETE /api/ministry/:groupId — authenticate, authorize ADMIN/PASTOR, delete ministry
router.delete('/:groupId', authenticate, authorize(['ADMIN', 'PASTOR']), deleteGroup);

export default router;