// Import bycrypt
import bcrypt from 'bcrypt';

// Import prisma
import { prisma } from '../utils/prismaClient';

type NewUserData = {
  name: string;
  email: string;
  password: string;
  role?: string;
};

// User data
export const newUser = async (data: NewUserData) => {

  // Hash the password
  const hashedPassword = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role || 'customer',
    },
  });
  const { password:_, ...userWithoutPassword } = user;
  return userWithoutPassword
};