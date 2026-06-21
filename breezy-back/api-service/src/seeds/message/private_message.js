import PrivateMessage from '../../databases/mongodb/models/message/private_message.js';
import fs from 'fs/promises';

export default async function runPrivateMessageSeed() {
    const data = await fs.readFile('src/data/message/private_messages.json', 'utf8');

    const privateMessages = JSON.parse(data);

    for (const privateMessage of privateMessages) {
        const existing = await PrivateMessage.findOne({
            _id: privateMessage._id
        });

        if (existing) {
            continue;
        }
        
        await PrivateMessage.create({
            _id: privateMessage._id,
            conversation_id: privateMessage.conversation_id,
            sender_id: privateMessage.sender_id,
            content: privateMessage.content,
            created_at: privateMessage.created_at,
            updated_at: privateMessage.updated_at,
        });
        //
        console.log(`PrivateMessage ${privateMessage._id} created`);
    }
    console.log("PrivateMessageSeed completed");
}
