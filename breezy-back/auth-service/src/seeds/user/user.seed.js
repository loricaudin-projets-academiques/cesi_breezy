import User from "../../databases/postgresql/models/user.js";
import fs from 'fs/promises';
import { hashPassword } from "../../utils/password.js";

export default async function runUserSeed() {
    const data = await fs.readFile('src/data/user/users.json', 'utf8');

    const users = JSON.parse(data);

    for (const user of users) {
        const existing = await User.findOne({
            where: {
                id: user.id
            }
        });

        if (existing) {
            continue;
        }
        
        await User.create({
            id: user.id,
            name: user.name,
            username: user.username,
            passwordHash: hashPassword(user.password),
            bio: user.bio,
            followers: user.followers,
            following: user.following,
            friends: user.friends,
            avatar: user.avatar,
            note: user.note,
            isPrivate: user.isPrivate,
            language: user.language,
            theme: user.theme,
            ambientGlow: user.ambientGlow,
            notificationsEnabled: user.notificationsEnabled,
            role: user.role,
            music: user.music,
        });
        //
        console.log(`User ${user.id} created`);
    }
    console.log("UserSeed completed");
}
