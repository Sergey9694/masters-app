import { db } from "../src/shared/lib/db";
import bcrypt from "bcryptjs";

async function main() {
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const hash = await bcrypt.hash(password, 10);

  // Find any existing admin user
  let user = await db.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (user) {
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: hash },
    });
    console.log(`Updated admin "${user.firstName}" with password hash`);
  } else {
    user = await db.user.create({
      data: {
        firstName: "admin",
        role: "ADMIN",
        phone: "79990000000",
        passwordHash: hash,
      },
    });
    console.log("Created new admin user");
  }

  console.log(`Login: admin / Password: ${process.env.ADMIN_PASSWORD || "admin123"}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
