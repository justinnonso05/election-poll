import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { success, fail } from '@/lib/apiREsponse';
import { updateAssociationSchema } from '@/lib/schemas/association';

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const result = updateAssociationSchema.safeParse(body);
    if (!result.success) {
      return fail('Invalid data', result.error.issues, 400);
    }

    const { id, name, description, logoUrl } = result.data;

    // Find association by id
    const existing = await prisma.association.findUnique({ where: { id } });
    if (!existing) {
      return fail('Association not found.', null, 404);
    }

    const updated = await prisma.association.update({
      where: { id },
      data: { name, description, logoUrl },
    });

    return success('Association updated successfully.', updated);
  } catch (error) {
    console.error(error);
    return fail('Failed to update association.', null, 500);
  }
}
