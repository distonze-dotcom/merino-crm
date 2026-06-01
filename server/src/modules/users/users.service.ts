import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";

export async function listUsers() {
  return prisma.user.findMany({
    where: { active: true },
    select: { id: true, email: true, name: true, avatar: true, color: true, role: true, active: true, createdAt: true },
    orderBy: { name: "asc" },
  });
}

export async function createUser(data: {
  email: string;
  password: string;
  name: string;
  avatar: string;
  color: string;
  role: string;
}) {
  const passwordHash = await bcrypt.hash(data.password, 10);
  return prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      name: data.name,
      avatar: data.avatar,
      color: data.color,
      role: data.role,
    },
    select: { id: true, email: true, name: true, avatar: true, color: true, role: true, active: true },
  });
}

export async function updateUser(
  id: string,
  data: Partial<{ name: string; avatar: string; color: string; role: string; active: boolean; password: string }>
) {
  const updateData: Record<string, unknown> = { ...data };
  if (data.password) {
    updateData.passwordHash = await bcrypt.hash(data.password, 10);
    delete updateData.password;
  }
  return prisma.user.update({
    where: { id },
    data: updateData,
    select: { id: true, email: true, name: true, avatar: true, color: true, role: true, active: true },
  });
}
