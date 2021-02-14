const Comment = require('../models/comment-model');
const {ErrorResponseBuilder, SuccessResponseBuilder} = require('../libraries/response-builder');
const logger = require('../libraries/log-message');

const addComment = (req, res, next) => {
    const comment = new Comment({
        userName: req.body.userName,
        userId: req.body.userId,
        summary: req.body.summary,
        issueId: req.body.issueId
    });
    comment.save()
            .then(doc => {
                let response = new SuccessResponseBuilder('Comment added successfully!!!')
                            .status(200)
                            .data(doc)
                            .build();
                return res.status(200).send(response);
            })
            .catch(error => {
                logger.log(error, req, 'CC-AC-1');
                let err = new ErrorResponseBuilder('We are Sorry, Unable to add comment, please try again later!!!').status(500).errorCode('CC-AC-1').errorType('UnknownError').build();
                return next(err);
            })
}

const getCommentsByIssueId = (req, res, next) => {
    Comment.find({issueId: req.body.issueId})
            .sort({createdDate: -1})
            .exec()
            .then(result => {
                let response = new SuccessResponseBuilder('Comments fetched successfully!!!')
                            .status(200)
                            .data(result)
                            .build();
                return res.status(200).send(response);
            })
            .catch(error => {
                logger.log(error, req, 'CC-AC-1');
                let err = new ErrorResponseBuilder('We are Sorry, Unable to add comment, please try again later!!!').status(500).errorCode('CC-AC-1').errorType('UnknownError').build();
                return next(err);
            })
}

module.exports = {
    addComment: addComment,
    getCommentsByIssueId: getCommentsByIssueId
}