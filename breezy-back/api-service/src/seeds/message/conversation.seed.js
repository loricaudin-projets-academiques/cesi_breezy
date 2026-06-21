import Conversation from '../../databases/mongodb/models/message/conversation.js';
import fs from 'fs/promises';

export default async function runConversationSeed() {
    const data = await fs.readFile('src/data/message/conversations.json', 'utf8');

    const conversations = JSON.parse(data);

    for (const conversation of conversations) {
        const existing = await Conversation.findOne({
            _id: conversation._id
        });

        if (existing) {
            continue;
        }
        
        await Conversation.create({
            _id: conversation._id,
            participants_ids: conversation.participants_ids,
            last_message_id: conversation.last_message_id,
            created_at: conversation.created_at,
            updated_at: conversation.updated_at,
        });
        //
        console.log(`Conversation ${conversation._id} created`);
    }
    console.log("ConversationSeed completed");
}
