/**
 * Runs full demo population for SCH-DEMO-01 (same as populate-full-demo).
 */
import prisma from '../src/config/database';
import { populateFullDemo } from './populate-full-demo';

async function main() {
  try {
    await populateFullDemo();
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
