const express = require('express');
const router = express.Router();

const {decodeToken, checkUser} = require('../middleware/check-auth');
const validateRequest = require('../middleware/validate-request');
const issueController = require('../controllers/issue-controller');
const extractFile = require('../middleware/file');


router.post('/create', decodeToken,
                        checkUser,
                        extractFile.single('attachment'),
                        validateRequest('IC-CI', 'title', 'description', 'assignee',
                                        'reporter', 'priority'),
                        issueController.createIssue);

router.post('/id', decodeToken,
                    checkUser,
                    validateRequest('IC-GIBI-1', 'issueId'),
                    issueController.getIssueById)

router.post('/all', decodeToken,
                    checkUser,
                    issueController.constructQueryForIssues,
                    issueController.getIssues)

router.post('/stats', decodeToken,
                        checkUser,
                        issueController.constructQueryForIssues,
                        issueController.getStatistics)

router.get('/labels', decodeToken, checkUser, issueController.getAvailableLabels);

router.post('/update', decodeToken, checkUser, validateRequest('IC-UI-1', 'updateField', 'content'), issueController.updateIssue);

router.post('/update-activity', decodeToken,
                                checkUser,
                                validateRequest('IC-UIA-1', 'issueId', 'summary'),
                                issueController.updateIssueActivity);

router.get('/watching', decodeToken, checkUser, issueController.getWatchingIssueIds);

module.exports = router;