import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanupDuplicateUsers() {
  try {
    // Get all users
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' }
    });

    // Group users by lowercase email
    const emailGroups = users.reduce((groups, user) => {
      const lowerEmail = user.email.toLowerCase();
      if (!groups[lowerEmail]) {
        groups[lowerEmail] = [];
      }
      groups[lowerEmail].push(user);
      return groups;
    }, {} as Record<string, typeof users>);

    // Find groups with duplicates
    const duplicateGroups = Object.entries(emailGroups)
      .filter(([_, users]) => users.length > 1);

    console.log(`Found ${duplicateGroups.length} email(s) with duplicate users`);

    for (const [email, duplicateUsers] of duplicateGroups) {
      console.log(`\nProcessing duplicates for email: ${email}`);
      
      // Get all users with their related data
      const usersWithData = await Promise.all(
        duplicateUsers.map(user => 
          prisma.user.findUnique({
            where: { id: user.id },
            include: {
              accounts: true,
              sessions: true,
              auditLogs: true,
            }
          })
        )
      );

      // Filter out any null results
      const validUsers = usersWithData.filter((user): user is NonNullable<typeof user> => user !== null);
      
      // Keep the first user (oldest) and merge data into it
      const [primaryUser, ...duplicatesToRemove] = validUsers;
      
      console.log(`Primary user ID: ${primaryUser.id}`);
      console.log(`Found ${duplicatesToRemove.length} duplicate(s)`);

      // For each duplicate user
      for (const dupUser of duplicatesToRemove) {
        console.log(`\nMerging user ${dupUser.id} into ${primaryUser.id}`);

        try {
          // Move all accounts to primary user
          if (dupUser.accounts.length > 0) {
            console.log(`Moving ${dupUser.accounts.length} account(s)`);
            await prisma.account.updateMany({
              where: { userId: dupUser.id },
              data: { userId: primaryUser.id }
            });
          }

          // Move all sessions to primary user
          if (dupUser.sessions.length > 0) {
            console.log(`Moving ${dupUser.sessions.length} session(s)`);
            await prisma.session.updateMany({
              where: { userId: dupUser.id },
              data: { userId: primaryUser.id }
            });
          }

          // Move all audit logs to primary user
          if (dupUser.auditLogs.length > 0) {
            console.log(`Moving ${dupUser.auditLogs.length} audit log(s)`);
            await prisma.auditLog.updateMany({
              where: { userId: dupUser.id },
              data: { userId: primaryUser.id }
            });
          }

          // Delete the duplicate user
          await prisma.user.delete({
            where: { id: dupUser.id }
          });

          console.log(`Successfully merged and deleted duplicate user ${dupUser.id}`);
        } catch (error) {
          console.error(`Error merging user ${dupUser.id}:`, error);
        }
      }
    }

    console.log('\nCleanup completed successfully');
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupDuplicateUsers()
  .catch((error) => {
    console.error('Failed to run cleanup:', error);
    process.exit(1);
  }); 