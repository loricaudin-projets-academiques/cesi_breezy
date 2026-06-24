import mongoose from "mongoose";




const NotificationSchema = new mongoose.Schema({

    recipient_id: { type: mongoose.Schema.Types.UUID, required: true },
    actor_id: { type: mongoose.Schema.Types.UUID, required: true },
    type: { type: String, enum: ['like', 'comment', 'follow', 'mention', 'repost'], required: true },
    target_type: { type: String, enum: ['post', 'comment'], required: true },
    target_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    is_read: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
    read_at: { type: Date, default: null },
});



const Notification = mongoose.model('Notification', NotificationSchema);



export default Notification;