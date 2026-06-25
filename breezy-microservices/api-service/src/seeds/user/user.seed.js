import fs from "fs/promises";
import bcrypt from "bcryptjs";

import User from "../../databases/postgresql/models/user/user.js";

const USERS_DATA_URL = new URL("../../data/user/users.json", import.meta.url);

export default async function runUserSeed() {
  const data = await fs.readFile(USERS_DATA_URL, "utf8");
  const users = JSON.parse(data);

  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, 10);

    await User.upsert({
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      passwordHash,
      bio: user.bio,
      followers: user.followers,
      following: user.following,
      friends: user.friends,
      avatar: user.avatar,
      note: user.note,
      language: user.language,
      theme: user.theme,
      ambientGlow: user.ambientGlow,
      notificationsEnabled: user.notificationsEnabled,
      role: user.role,
      isSuspended: user.isSuspended,
    });
  }

  console.log(`UserSeed completed: ${users.length} users ready`);
}
