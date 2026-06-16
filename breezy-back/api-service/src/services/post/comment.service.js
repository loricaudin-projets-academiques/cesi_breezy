module.exports = {

    getCommentById: async (id) => {
        return `Id = ${id}`;
    },

    createPostComment: async (
        post,
        author_id,
        content
    ) => {
        const comment = null;

        return comment;
    }
};