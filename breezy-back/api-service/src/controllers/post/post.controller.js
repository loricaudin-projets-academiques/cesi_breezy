const PostService = require('../../services/post/post.service');

module.exports = {

    getPostById: async (req, res) => { // TODO
        const id = req.params['id'];
        const post = await PostService.getPostById(id);
        res.status(200).json({test: post})
    }
}
