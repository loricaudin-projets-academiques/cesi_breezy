import mongoose from "mongoose";




const PrivateMessageSchema = new mongoose.Schema({

    conversation_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Conversation' },
    sender_id: { type: String, required: true },
    content: { type: String, required: true },
    media: { type: [String], default: [] },
    is_read: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
});



const PrivateMessage = mongoose.model('PrivateMessage', PrivateMessageSchema);


export default PrivateMessage;
