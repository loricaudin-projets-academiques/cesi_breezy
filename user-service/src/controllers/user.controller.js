import {
  followUser,
  getMe,
  getPublicProfile,
  getRelationList,
  searchUsers,
  unfollowUser,
  updateMe,
} from "../services/user.service.js";

async function fetchMe(req, res, next) {
  try {
    return res.json(await getMe({ authUser: req.user }));
  } catch (error) {
    return next(error);
  }
}

async function patchMe(req, res, next) {
  try {
    return res.json(await updateMe({ authUser: req.user, updates: req.body }));
  } catch (error) {
    return next(error);
  }
}

async function findUsers(req, res, next) {
  try {
    return res.json(await searchUsers({ authUser: req.user, query: req.query.q }));
  } catch (error) {
    return next(error);
  }
}

async function fetchPublicProfile(req, res, next) {
  try {
    return res.json(await getPublicProfile({ authUser: req.user, username: req.params.username }));
  } catch (error) {
    return next(error);
  }
}

async function follow(req, res, next) {
  try {
    const result = await followUser({ authUser: req.user, username: req.params.username });
    return res.status(result.status).json(result.data);
  } catch (error) {
    return next(error);
  }
}

async function unfollow(req, res, next) {
  try {
    return res.json(await unfollowUser({ authUser: req.user, username: req.params.username }));
  } catch (error) {
    return next(error);
  }
}

async function fetchRelationList(req, res, next) {
  try {
    return res.json(await getRelationList({ authUser: req.user, type: req.params.type }));
  } catch (error) {
    return next(error);
  }
}

export {
  fetchMe,
  fetchPublicProfile,
  fetchRelationList,
  findUsers,
  follow,
  patchMe,
  unfollow,
};
