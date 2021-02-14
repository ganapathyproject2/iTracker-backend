const express = require('express');
const router = express.Router();

const {decodeToken, checkUser} = require('../middleware/check-auth');
const validateRequest = require('../middleware/validate-request');
const commentController = require('../controllers/comment-controller');

router.post('/add', decodeToken,
                    checkUser,
                    validateRequest('CC-AC', 'userName', 'userId', 'summary', 'issueId'),
                    commentController.addComment);

router.post('/all', decodeToken,
                    checkUser,
                    validateRequest('CC-GCBII', 'issueId'),
                    commentController.getCommentsByIssueId);

module.exports = router;