import mongoose from "mongoose";




const ConversationSchema = new mongoose.Schema({

    participants_ids: { type: [String], required: true, index: true },
    last_message_id: { type: mongoose.Schema.Types.ObjectId, required: false, ref: 'Message' },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
});



const Conversation = mongoose.model('Conversation', ConversationSchema);



export default Conversation;
