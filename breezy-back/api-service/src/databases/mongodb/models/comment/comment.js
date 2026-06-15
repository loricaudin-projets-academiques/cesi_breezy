import mongoose from "mongoose";




const CommentSchema = new mongoose.Schema({

    post_id: { type: mongoose.Schema.Types.ObjectId },
    parent_comment_id: { type: mongoose.Schema.Types.ObjectId, required: false },
    author_id: { type: mongoose.Schema.Types.UUID },
    content: { type: String },
    mentions: { type: [String], default: [] },
    status: { type: String, enum: ['published', 'draft', 'deleted'], default: 'draft' },
    likes_count: { type: Number, default: 0 },
    replies_count: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    deleted_at: { type: Date, default: null },
});



const Comment = mongoose.model('Comment', CommentSchema);



export default Comment;