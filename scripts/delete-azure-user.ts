import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function deleteAzureUser(email: string) {
  try {
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { accounts: true },
    });

    if (!user) {
      console.log(`No user found with email: ${email}`);
      return;
    }

    // Delete related records
    await prisma.$transaction(async (tx) => {
      // Delete accounts
      await tx.account.deleteMany({
        where: { userId: user.id },
      });

      // Delete sessions
      await tx.session.deleteMany({
        where: { userId: user.id },
      });

      // Delete audit logs
      await tx.auditLog.deleteMany({
        where: { userId: user.id },
      });

      // Delete user
      await tx.user.delete({
        where: { id: user.id },
      });
    });

    console.log(`Successfully deleted user: ${email}`);
  } catch (error) {
    console.error("Error deleting user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Replace this with your Microsoft account email
const emailToDelete = process.argv[2];

if (!emailToDelete) {
  console.log("Please provide an email address as an argument");
  process.exit(1);
}

deleteAzureUser(emailToDelete); 