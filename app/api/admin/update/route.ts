import { prisma } from '@/lib/prisma';
import { success, fail } from '@/lib/apiREsponse';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import bcrypt from 'bcryptjs';
import { updateSchema } from '@/lib/schemas/admin';

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return fail('Unauthorized', null, 401);
    }

    const body = await req.json();

    // Validate the request body
    const validation = updateSchema.safeParse(body);
    if (!validation.success) {
      return fail('Invalid request data', validation.error.issues, 400);
    }

    const { email, currentPassword, newPassword, confirmPassword } = validation.data;

    // Get the current admin from session
    const adminId = session.user.id;

    // Fetch current admin data
    const currentAdmin = await prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!currentAdmin) {
      return fail('Admin not found', null, 404);
    }

    // Prepare update data
    const updateData: { email?: string; passwordHash?: string } = {};

    // Update email if changed
    if (email && email !== currentAdmin.email) {
      // Check if email is already taken
      const existingAdmin = await prisma.admin.findUnique({
        where: { email },
      });

      if (existingAdmin && existingAdmin.id !== adminId) {
        return fail('Email already in use', null, 400);
      }

      updateData.email = email;
    }

    // Update password if provided
    if (newPassword && newPassword.trim()) {
      // Validate new password length
      if (newPassword.length < 6) {
        return fail('New password must be at least 6 characters', null, 400);
      }

      // Verify current password is provided
      if (!currentPassword || !currentPassword.trim()) {
        return fail('Current password is required to change password', null, 400);
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, currentAdmin.passwordHash);
      if (!isPasswordValid) {
        return fail('Current password is incorrect', null, 400);
      }

      // Verify new passwords match
      if (newPassword !== confirmPassword) {
        return fail('New passwords do not match', null, 400);
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateData.passwordHash = hashedPassword;
    }

    // If only email is being updated, still require current password for security
    if (email && email !== currentAdmin.email && (!newPassword || !newPassword.trim())) {
      if (!currentPassword || !currentPassword.trim()) {
        return fail('Current password is required to update email', null, 400);
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, currentAdmin.passwordHash);
      if (!isPasswordValid) {
        return fail('Current password is incorrect', null, 400);
      }
    }

    // Perform the update
    if (Object.keys(updateData).length === 0) {
      return fail('No changes to update', null, 400);
    }

    const updatedAdmin = await prisma.admin.update({
      where: { id: adminId },
      data: updateData,
      select: {
        id: true,
        email: true,
        role: true,
        associationId: true,
      },
    });

    return success('Profile updated successfully', updatedAdmin);
  } catch (error) {
    console.error('Admin update error:', error);
    return fail('Failed to update profile', null, 500);
  }
}
