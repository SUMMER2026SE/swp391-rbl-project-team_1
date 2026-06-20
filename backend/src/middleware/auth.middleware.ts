import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import prisma from '../prisma/client';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    studentId?: string;
    mentorId?: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'edupath_super_secret_key_change_me_in_production';

export async function verifyToken(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  let token = req.cookies?.token;
  
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (!token) {
    res.status(401).json({ success: false, message: 'No token provided' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        student: true,
        mentor: true
      }
    });

    if (!user) {
      res.status(401).json({ success: false, message: 'User not found' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      studentId: user.student?.id || undefined,
      mentorId: user.mentor?.id || undefined
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ success: false, message: 'Token expired' });
      return;
    }
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
}
