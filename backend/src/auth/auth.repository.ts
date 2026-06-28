import { prisma } from "../config/prisma";

export const authRepository = {
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id:        true,
        email:     true,
        name:      true,
        phone:     true,
        role:      true,
        createdAt: true,
      },
    });
  },

  createUser(data: { name: string; email: string; passwordHash: string; phone?: string }) {
    return prisma.user.create({
      data,
      select: { id: true, email: true, name: true, role: true },
    });
  },

  updateUser(id: string, data: { name?: string; phone?: string }) {
    return prisma.user.update({
      where: { id },
      data,
      select: {
        id:    true,
        email: true,
        name:  true,
        phone: true,
        role:  true,
      },
    });
  },
};
