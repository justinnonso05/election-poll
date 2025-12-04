import { prisma } from '@/lib/prisma';
import { associationSchema } from '@/lib/schemas/association';
import { success, fail } from '@/lib/apiREsponse';

export async function POST(req: Request) {
  try {
    // Parse JSON body from the request
    const body = await req.json();

    // Validate request body using Zod schema
    const result = associationSchema.safeParse(body);
    if (!result.success) {
      return fail('Invalid data', result.error.issues, 400);
    }

    const { name, description, logoUrl } = result.data;

    // Check if an association with this name already exists
    const existing = await prisma.association.findUnique({ where: { name } });
    if (existing) {
      return fail('Association already exists.', null, 409);
    }

    // Create the association in the database
    const association = await prisma.association.create({
      data: { name, description, logoUrl },
    });

    // Return the created association as JSON
    return success('Association created successfully.', association, 201);
  } catch (error) {
    console.error(error);
    // Handle unexpected errors
    return fail('Failed to create association.', null, 500);
  }
}
