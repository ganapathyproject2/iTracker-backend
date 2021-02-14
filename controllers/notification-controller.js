const Notification = require('../models/notification-model');
const {ErrorResponseBuilder, SuccessResponseBuilder} = require('../libraries/response-builder');
const logger = require('../libraries/log-message');

const addNotification = (req, res, next) => {
    let notification = {
        message: req.body.message,
        sender: req.body.sender,
        type: req.body.type,
        status: req.body.status,
        priority: req.body.priority
    };
    if (req.body.issue) {
        notification.issue = req.body.issue;
    }
    if (req.body.project) {
        notification.project = req.body.project;
    }
    let notifications = req.body.receivers.map(receiver => {
        let obj = Object.assign({}, notification);
        obj.userId = receiver.userId;
        return obj;
    });

    Notification.create(notifications)
        .then(docs => {
            let response = new SuccessResponseBuilder('Notification added successfully!!!')
                    .status(200)
                    .data(docs)
                    .build();
            return res.status(200).send(response);
        })
        .catch(error => {
            logger.log(error, req, 'NC-AN-1');
            let err = new ErrorResponseBuilder().status(500).errorCode('NC-AN-1').errorType('UnknownError').build();
            return next(err);
        })
}

const getNotifications = (req, res, next) => {
    let queryObj = {
        userId: req.userData.userId
    };
    if (req.body.status) {
        queryObj.status = req.body.status;
    }
    if (req.body.priority) {
        queryObj.priority = req.body.priority;
    }
    Notification.find(queryObj)
                .sort({_id: -1})
                .exec()
                .then(docs => {
                     let response = new SuccessResponseBuilder('Notification added successfully!!!')
                        .status(200)
                        .data(docs)
                        .build();
                    return res.status(200).send(response);
                })
                 .catch(error => {
                    logger.log(error, req, 'NC-GN-1');
                    let err = new ErrorResponseBuilder().status(500).errorCode('NC-GN-1').errorType('UnknownError').build();
                    return next(err);
                })
}

const updateNotification = (req, res, next) => {
    let queryObj = {userId: req.userData.userId};
    let criteria = req.body.criteria; // single or null
    if (criteria) {
        queryObj._id = req.body.notificationId;
    }
    Notification.updateMany(queryObj, {$set: {status: 'read'}}, {multi: true, new: true})
                .then(docs => {
                    let response = new SuccessResponseBuilder('Notifications updated successfully!!!')
                    .status(200)
                    .data({})
                    .build();
                    return res.status(200).send(response);
                })
                .catch(error => {
                    logger.log(error, req, 'NC-UN-1');
                    let err = new ErrorResponseBuilder().status(500).errorCode('NC-UN-1').errorType('UnknownError').build();
                    return next(err);
                })
}

module.exports = {
    addNotification: addNotification,
    getNotifications: getNotifications,
    updateNotification: updateNotification
}
