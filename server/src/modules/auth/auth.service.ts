import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { signToken } from "../../lib/jwt";

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active) {
    throw new Error("Credenciales inválidas");
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new Error("Credenciales inválidas");
  }
  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      color: user.color,
      role: user.role,
    },
  };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, avatar: true, color: true, role: true, active: true },
  });
  if (!user) throw new Error("Usuario no encontrado");
  return user;
}
