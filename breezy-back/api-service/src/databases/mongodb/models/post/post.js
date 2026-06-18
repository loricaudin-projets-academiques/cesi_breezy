import mongoose from "mongoose";




const PostSchema = new mongoose.Schema({
    author_id: { type: mongoose.Schema.Types.UUID },
    content: { type: String },
    tags: { type: [String], default: [] },
    media: { type: [String], default: [] },
    mentions: { type: [String], default: [] },
    visibility: { type: String, enum: ['public', 'private'], default: 'public' },
    status: { type: String, enum: ['published', 'draft', 'deleted'], default: 'draft' },
    likes_count: { type: Number, default: 0 },
    comments_count: { type: Number, default: 0 },
    reposts_count: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    deleted_at: { type: Date, default: null },
});



const Post = mongoose.model('Post', PostSchema);



export default Post;