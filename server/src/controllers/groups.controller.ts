import { Response } from 'express';
import prisma from '../config/database';
import { logger } from '../utils/logger';
import { AppError, NotFoundError, ValidationError, ForbiddenError } from '../utils/errors';
import { AuthRequest } from '../middleware/auth';

async function getTeacherStudentIds(teacherId: string, schoolId: string): Promise<string[]> {
  const teacherClasses = await prisma.teacherClass.findMany({
    where: { teacherId },
    select: { classId: true },
  });
  const classIds = teacherClasses.map((tc) => tc.classId);
  if (classIds.length === 0) return [];

  const students = await prisma.user.findMany({
    where: { role: 'STUDENT', schoolId },
    select: { id: true, metadata: true },
  });

  return students
    .filter((s) => {
      const meta = s.metadata as any;
      return meta?.classId && classIds.includes(meta.classId);
    })
    .map((s) => s.id);
}

async function validateTeacherGroupAccess(groupId: string, teacherId: string, schoolId: string) {
  const group = await prisma.group.findFirst({
    where: { id: groupId, schoolId, createdBy: teacherId },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, photo: true, role: true } },
        },
      },
    },
  });
  if (!group) throw new NotFoundError('Group not found');
  return group;
}

export const groupsController = {
  async createGroup(req: AuthRequest, res: Response) {
    try {
      const teacherId = req.user?.id;
      const schoolId = req.user?.schoolId;
      const { name, description, memberIds } = req.body as {
        name: string;
        description?: string;
        memberIds: string[];
      };

      if (!teacherId || !schoolId) throw new ForbiddenError('Authentication required');
      if (!name?.trim()) throw new ValidationError('Group name is required');
      if (!Array.isArray(memberIds) || memberIds.length === 0) {
        throw new ValidationError('At least one member is required');
      }

      const allowedStudentIds = new Set(await getTeacherStudentIds(teacherId, schoolId));
      const validMemberIds = memberIds.filter((id) => allowedStudentIds.has(id));
      if (validMemberIds.length === 0) {
        throw new ValidationError('No valid students selected for this group');
      }

      const group = await prisma.group.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          createdBy: teacherId,
          schoolId,
          members: {
            create: validMemberIds.map((userId) => ({ userId })),
          },
        },
        include: {
          members: {
            include: { user: { select: { id: true, name: true, photo: true } } },
          },
        },
      });

      return res.status(201).json({ success: true, data: group });
    } catch (error) {
      logger.error('Create group error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create group', 500);
    }
  },

  async getGroups(req: AuthRequest, res: Response) {
    try {
      const teacherId = req.user?.id;
      const schoolId = req.user?.schoolId;
      if (!teacherId || !schoolId) throw new ForbiddenError('Authentication required');

      const groups = await prisma.group.findMany({
        where: { createdBy: teacherId, schoolId },
        include: {
          members: { select: { id: true } },
        },
        orderBy: { updatedAt: 'desc' },
      });

      const groupIds = groups.map((g) => g.id);
      const groupIdSet = new Set(groupIds);
      const lastMessageByGroup = new Map<string, { body: string; createdAt: Date }>();

      if (groupIds.length > 0) {
        const recentGroupMessages = await prisma.notification.findMany({
          where: { category: 'group_message' },
          orderBy: { createdAt: 'desc' },
          take: 300,
        });
        for (const msg of recentGroupMessages) {
          const groupId = (msg.data as any)?.groupId as string | undefined;
          if (groupId && groupIdSet.has(groupId) && !lastMessageByGroup.has(groupId)) {
            lastMessageByGroup.set(groupId, { body: msg.body, createdAt: msg.createdAt });
          }
        }
      }

      const list = groups.map((g) => ({
        id: g.id,
        name: g.name,
        description: g.description,
        memberCount: g.members.length,
        lastMessage: lastMessageByGroup.get(g.id)?.body ?? null,
        lastMessageAt: lastMessageByGroup.get(g.id)?.createdAt?.toISOString() ?? null,
        createdAt: g.createdAt.toISOString(),
        updatedAt: g.updatedAt.toISOString(),
      }));

      return res.json({ success: true, data: list });
    } catch (error) {
      logger.error('Get groups error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to load groups', 500);
    }
  },

  async getGroup(req: AuthRequest, res: Response) {
    try {
      const teacherId = req.user?.id;
      const schoolId = req.user?.schoolId;
      const { id } = req.params;
      if (!teacherId || !schoolId) throw new ForbiddenError('Authentication required');

      const group = await validateTeacherGroupAccess(id, teacherId, schoolId);

      return res.json({
        success: true,
        data: {
          id: group.id,
          name: group.name,
          description: group.description,
          memberCount: group.members.length,
          members: group.members.map((m) => ({
            id: m.user.id,
            name: m.user.name,
            photo: m.user.photo,
            role: m.user.role,
          })),
          createdAt: group.createdAt.toISOString(),
          updatedAt: group.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      logger.error('Get group error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to load group', 500);
    }
  },

  async addMembers(req: AuthRequest, res: Response) {
    try {
      const teacherId = req.user?.id;
      const schoolId = req.user?.schoolId;
      const { id } = req.params;
      const { memberIds } = req.body as { memberIds: string[] };

      if (!teacherId || !schoolId) throw new ForbiddenError('Authentication required');
      if (!Array.isArray(memberIds) || memberIds.length === 0) {
        throw new ValidationError('memberIds array is required');
      }

      await validateTeacherGroupAccess(id, teacherId, schoolId);
      const allowedStudentIds = new Set(await getTeacherStudentIds(teacherId, schoolId));
      const validMemberIds = memberIds.filter((memberId) => allowedStudentIds.has(memberId));

      await prisma.groupMember.createMany({
        data: validMemberIds.map((userId) => ({ groupId: id, userId })),
        skipDuplicates: true,
      });

      const group = await validateTeacherGroupAccess(id, teacherId, schoolId);
      return res.json({
        success: true,
        message: 'Members added',
        data: {
          id: group.id,
          memberCount: group.members.length,
          members: group.members.map((m) => ({
            id: m.user.id,
            name: m.user.name,
            photo: m.user.photo,
          })),
        },
      });
    } catch (error) {
      logger.error('Add group members error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to add members', 500);
    }
  },

  async removeMember(req: AuthRequest, res: Response) {
    try {
      const teacherId = req.user?.id;
      const schoolId = req.user?.schoolId;
      const { id, userId } = req.params;
      if (!teacherId || !schoolId) throw new ForbiddenError('Authentication required');

      await validateTeacherGroupAccess(id, teacherId, schoolId);

      await prisma.groupMember.deleteMany({
        where: { groupId: id, userId },
      });

      return res.json({ success: true, message: 'Member removed' });
    } catch (error) {
      logger.error('Remove group member error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to remove member', 500);
    }
  },

  async sendGroupMessage(req: AuthRequest, res: Response) {
    try {
      const teacherId = req.user?.id;
      const schoolId = req.user?.schoolId;
      const { id } = req.params;
      const { content } = req.body as { content: string };

      if (!teacherId || !schoolId) throw new ForbiddenError('Authentication required');
      if (!content?.trim()) throw new ValidationError('content is required');

      const group = await validateTeacherGroupAccess(id, teacherId, schoolId);
      const teacher = await prisma.user.findUnique({
        where: { id: teacherId },
        select: { name: true, role: true },
      });

      const memberUserIds = group.members.map((m) => m.userId);
      const parentLinks =
        memberUserIds.length > 0
          ? await prisma.parentStudent.findMany({
              where: { studentId: { in: memberUserIds } },
              select: { parentId: true, studentId: true },
            })
          : [];

      const notifyUserIds = new Set<string>(memberUserIds);
      for (const link of parentLinks) {
        notifyUserIds.add(link.parentId);
      }

      const messageData = {
        groupId: group.id,
        groupName: group.name,
        fromUserId: teacherId,
        fromName: teacher?.name ?? 'Teacher',
        fromRole: teacher?.role ?? 'TEACHER',
        type: 'group_message',
        senderId: teacherId,
        sendBatchId: `batch_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      };

      await Promise.all(
        Array.from(notifyUserIds).map((userId) =>
          prisma.notification.create({
            data: {
              userId,
              category: 'group_message',
              title: `Group: ${group.name}`,
              body: content.trim(),
              data: messageData as any,
              channels: ['in_app'] as any,
            },
          })
        )
      );

      await prisma.group.update({
        where: { id: group.id },
        data: { updatedAt: new Date() },
      });

      return res.status(201).json({
        success: true,
        message: 'Message sent to group',
        data: { recipientCount: notifyUserIds.size },
      });
    } catch (error) {
      logger.error('Send group message error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to send group message', 500);
    }
  },

  async deleteGroup(req: AuthRequest, res: Response) {
    try {
      const teacherId = req.user?.id;
      const schoolId = req.user?.schoolId;
      const { id } = req.params;
      if (!teacherId || !schoolId) throw new ForbiddenError('Authentication required');

      await validateTeacherGroupAccess(id, teacherId, schoolId);
      await prisma.group.delete({ where: { id } });

      return res.json({ success: true, message: 'Group deleted' });
    } catch (error) {
      logger.error('Delete group error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete group', 500);
    }
  },
};
