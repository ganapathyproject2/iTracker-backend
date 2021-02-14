const Comment = require('../models/comment-model');
const Issue = require('../models/issue-model');
const {ErrorResponseBuilder, SuccessResponseBuilder} = require('../libraries/response-builder');
const { parseJSON } = require('../libraries/parse-json');
const dateUtility = require('../libraries/date-formatter');
const logger = require('../libraries/log-message');
const config = require('../config/config');

const createIssue = (req, res, next) => {
    const url = req.protocol + '://' + req.get('host');
    // since we receive data in formData format, parse the JSON string into objects
    const project = parseJSON(req.body.project) || {projectId: config.defaultProject.id, title: 'Default'};
    const assignee = parseJSON(req.body.assignee) || parseJSON(req.body.reporter);
    const reporter = parseJSON(req.body.reporter);
    const activity = parseJSON(req.body.activity);
    if (!(project && assignee && reporter && activity)) {
        logger.log({name: 'Invalid format for project, assignee, reporter, activity'}, req, 'IC-CI-1');
        let err = new ErrorResponseBuilder('Invalid format for project, assignee, reporter').status(400).errorCode('IC-CI-1').errorType('DataValidationError').build();
        return next(err);
    }
    const issue = {
        title: req.body.title,
        description: req.body.description,
        priority: req.body.priority,
        project: project,
        assignee: assignee,
        reporter: reporter,
        createdDate: dateUtility.formatDate(),
        activity: activity
    };
    if (req.body.watchers && parseJSON(req.body.watchers)) {
        issue.watchers = parseJSON(req.body.watchers);
    }
    if (req.body.labels && parseJSON(req.body.labels)) {
        issue.labels = parseJSON(req.body.labels);
    }

    if (req.file && req.file.filename) {
        issue.attachment = url + '/images/' + req.file.filename;
    }
    const issueModel = new Issue(issue);
    issueModel.save()
            .then(doc => {
                let response = new SuccessResponseBuilder('Issue created successfully!!!')
                            .status(201)
                            .data({issueId: doc._id})
                            .build();
                return res.status(201).send(response);
            })
            .catch(error => {
                logger.log(error, req, 'IC-CI-2');
                let err = new ErrorResponseBuilder().status(500).errorCode('IC-CI-2').errorType('UnknownError').build();
                return next(err);
            })
}

const getIssueById = (req, res, next) => {
    Issue.findById(req.body.issueId)
        .exec()
        .then(doc => {
            if (!doc || !doc._id) {
                logger.log({name: 'No match found'}, req, 'IC-GIBI-1');
                let err = new ErrorResponseBuilder('No Issue Found with given Id').status(404).errorCode('IC-CGIBI-1').errorType('DataNotFoundError').build();
                return next(err);
            }
            let data = {
                issueId: doc._id,
                title: doc.title,
                description: doc.description,
                priority: doc.priority,
                assignee: doc.assignee,
                reporter: doc.reporter,
                project: doc.project,
                status: doc.status,
                imageUrl: doc.attachment,
                watchers: doc.watchers,
                labels: doc.labels,
                lastModifiedOn: doc.lastModifiedOn,
                createdDate: doc.createdDate,
                activity: doc.activity
            };
            let response = new SuccessResponseBuilder('Issue fetched successfully!!!')
                            .status(200)
                            .data(data)
                            .build();
            return res.status(200).send(response);
        })
        .catch(error => {
            logger.log(error, req, 'IC-GIBI-2');
            let err = new ErrorResponseBuilder().status(500).errorCode('IC-GIBI-2').errorType('UnknownError').build();
            return next(err);
        })
}

const constructQueryForIssues = (req, res, next) => {
    let query = {};
    $and = [];
    if (req.body.title && req.body.title !== '' && req.body.title !== null) {
        $and.push({title: new RegExp(req.body.title, 'gi')}); // get projects that matches the search string
    }
    if (req.body.issueType && req.body.issueType !== '' && req.body.issueType !== null) {
        $and.push({status: req.body.issueType});
    }
    if (req.body.label && req.body.label !== '' && req.body.label !== null) {
        $and.push({labels: req.body.label});
    }
    if (req.body.priority && req.body.priority !== '' && req.body.priority !== null) {
        $and.push({priority: req.body.priority});
    }
    if (req.body.projectId && req.body.projectId !== '' && req.body.projectId !== null) {
        if (req.body.projectId === 'default') {
            req.body.projectId = config.defaultProject.id;
        }
        $and.push({"project.projectId": req.body.projectId});
    }
    if (req.body.status && req.body.status !== '' && req.body.status !== null && Array.isArray(req.body.status)) {
        $and.push({status: {$in: req.body.status}});
    }
    if (req.body.userId && req.body.userId !== '' && req.body.userId !== null) {
        let or = [{"assignee.userId": req.body.userId},
                    {"reporter.userId": req.body.userId}];
        $and.push({$or: or});
    }
    if ($and && $and.length > 0) {
        query.$and = $and;
    } else {
        query = {}; // no filters
    }
    req.issuesQuery = query;
    return next();
}

const getIssues = (req, res, next) => {
    Issue.find(req.issuesQuery)
        .exec()
        .then(docs => {
            let jsonResponse;
            if (docs && docs.length === 0) {
                jsonResponse = docs;
            } else {
                jsonResponse = docs.map(doc => {
                    let obj = {};
                    obj.issueId = doc._id;
                    obj.title = doc.title;
                    obj.project = doc.project;
                    obj.priority = doc.priority;
                    obj.status = doc.status;
                    obj.createdDate = doc.createdDate;
                    obj.assignee = doc.assignee;
                    obj.reporter = doc.reporter;
                    return obj;
                });
            }
            let response = new SuccessResponseBuilder('Issues fetched successfully!!!')
                                .status(200)
                                .data(jsonResponse)
                                .build();
            return res.status(200).send(response);
        })
        .catch(error => {
            logger.log(error, req, 'IC-GI-1');
            let err = new ErrorResponseBuilder().status(500).errorCode('IC-GI-2').errorType('UnknownError').build();
            return next(err);
        })
}

const getAvailableLabels = (req, res, next) => {
    Issue.find({}, {labels: 1})
        .exec()
        .then(docs => {
            let labels = docs.map(doc => doc.labels).reduce((acc, cur) => acc.concat(cur), []);
            labels = Array.from(new Set(labels));
            // labels = labels.flatMap(label => label); // flatMap has no support here
            let response = new SuccessResponseBuilder('Labels fetched successfully!!!')
                            .status(200)
                            .data(labels)
                            .build();
            return res.status(200).send(response);
        })
        .catch(error => {
            logger.log(error, req, 'IC-GAL-1');
            let err = new ErrorResponseBuilder().status(500).errorCode('IC-GAL-1').errorType('UnknownError').build();
            return next(err);
        })
}
/* Need to optimize the query by using $group later */
const getStatistics = (req, res, next) => {
    Issue.find(req.issuesQuery, {status: 1})
        .exec()
        .then(issues => {
            let responseObj = {};
            responseObj.totalIssues = issues.length || 0;
            let groupedData = [];
            if (responseObj.totalIssues) {
                groupedData = issues.reduce((acc, cur) => {
                    acc[cur.status] = (acc[cur.status] || 0) + 1;
                    return acc;
                }, {});
            }
            responseObj.issues = groupedData;

            let response = new SuccessResponseBuilder('Statistics fetched successfully!!!')
                            .status(200)
                            .data(responseObj)
                            .build();
            return res.status(200).send(response);
        })
        .catch(error => {
            logger.log(error, req, 'IC-GS-1');
            let err = new ErrorResponseBuilder().status(500).errorCode('IC-GS-1').errorType('UnknownError').build();
            return next(err);
        })
}

const getWatchingIssueIds = (req, res, next) => {
    Issue.find({$or: [{"assignee.userId": req.userData.userId},
                        {"reporter.userId": req.userData.userId},
                        {watchers: {$elemMatch: {userId: {$in: [req.userData.userId]}}}}
                ]}, {_id: 1})
                .then(docs => {
                    let ids = docs.map(doc => doc._id);
                    let response = new SuccessResponseBuilder('Watching issues fetched successfully!!!')
                            .status(200)
                            .data(ids)
                            .build();
                    return res.status(200).send(response);
                })
                .catch(error => {
                    logger.log(error, req, 'IC-GWII-1');
                    let err = new ErrorResponseBuilder().status(500).errorCode('IC-GWII-1').errorType('UnknownError').build();
                    return next(err);
                })
}



const updateIssueActivity = (req, res, next) => {
    const activityObj = {
        summary: req.body.summary,
        dateLog: new Date()
    };
    Issue.findByIdAndUpdate(req.body.issueId,
        {$push: {'activity': activityObj}}, {new: true})
        .exec()
        .then(result => {
            let response = new SuccessResponseBuilder('Activity updated successfully!!!')
                            .status(200)
                            .data(result)
                            .build();
            return res.status(200).send(response);
        })
        .catch(error => {
            logger.log(error, req, 'IC-UIA-1');
            let err = new ErrorResponseBuilder('We are Sorry, Unable to update issue activity, please try again later!!!').status(500).errorCode('IC-UIA-1').errorType('UnknownError').build();
            return next(err);
        });
}

const updateIssue = (req, res, next) => {
    let updateField = req.body.updateField;
    let updateValue = req.body.content;
    let obj = {};
    obj[updateField] = updateValue;
    Issue.findOneAndUpdate({_id: req.body.issueId}, {$set: obj}, {new: true})
        .then(result => {
            let response = new SuccessResponseBuilder('Issue updated successfully!!!')
                            .status(200)
                            .data(result)
                            .build();
            return res.status(200).send(response);
        })
        .catch(error => {
            console.log(error);
            logger.log(error, req, 'IC-UI-1');
            let err = new ErrorResponseBuilder('We are Sorry, Unable to update issue, please try again later!!!').status(500).errorCode('IC-UI-1').errorType('UnknownError').build();
            return next(err);
        })
}


module.exports = {
    createIssue: createIssue,
    getIssueById: getIssueById,
    constructQueryForIssues: constructQueryForIssues,
    getIssues: getIssues,
    getAvailableLabels: getAvailableLabels,
    getStatistics: getStatistics,
    getWatchingIssueIds: getWatchingIssueIds,
    updateIssueActivity: updateIssueActivity,
    updateIssue: updateIssue
}