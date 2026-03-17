import { getSession } from "./auth";
import { db } from "./db";

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  try {
    const user = await db.user.findUnique({
      where: { id: session.userId },
      include: {
        masterProfile: true,
      },
    });
    return user;
  } catch (error) {
    return null;
  }
}
