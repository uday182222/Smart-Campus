import { PrismaClient } from '@prisma/client';

/**
 * Generate a unique school code like SCH-X7K2-9M
 */
export function generateSchoolCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const part1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const part2 = Array.from({ length: 2 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `SCH-${part1}-${part2}`;
}

/**
 * Ensure uniqueness by checking DB
 */
export async function generateUniqueSchoolCode(prisma: PrismaClient): Promise<string> {
  let code = generateSchoolCode();
  let exists = await prisma.school.findUnique({ where: { schoolCode: code } });
  while (exists) {
    code = generateSchoolCode();
    exists = await prisma.school.findUnique({ where: { schoolCode: code } });
  }
  return code;
}
