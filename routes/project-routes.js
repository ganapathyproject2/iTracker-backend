const express = require('express');
const router = express.Router();

const {decodeToken, checkUser} = require('../middleware/check-auth');
const validateRequest = require('../middleware/validate-request');
const projectController = require('../controllers/project-controller');

/**
 * @apiVersion 1.0.0
 *
 * @api {post} /api/project/create Create New Project
 * @apiName CreateProject
 * @apiGroup Project
 *
 * @apiParam {String} title Project Title
 * @apiParam {String} keyCode  Two characters key code
 * @apiParam {String} ownerName Project Owner Name
 * @apiParam {String} ownerId Project Owner ID
 * @apiParam {String} type Project Type
 * @apiParam {Array} members Project Members
 * @apiParam {String} members.userId User ID
 * @apiParam {String} members.firstName User First Name
 * @apiParam {String} members.lastName User Last Name
 *
 *
 * @apiSuccessExample {json} Success Response
 *    HTTP/1.1 201 OK
 *    {
 *      "error": false,
 *      "message": "Project created successfully!!!",
 *      "data": {
 *          "projectId": "5b9ff8f4558ca01054196469",
 *          "title": "Courvoisier Development",
 *          "keyCode": "CD",
 *          "type": "Website",
 *          "ownerName": "Ganapathy P",
 *          "ownerId": "XYklP6j",
 *          "members": [
 *              {
 *                  "userId": "XYklP6j",
 *                  "firstName": "Ganapathy",
 *                  "lastName": "P"
 *              },
 *              {
 *                  "userId": "NlPTu8X",
 *                  "firstName": "Vishnu",
 *                  "lastName": "Sudhan"
 *              }
 *          ]
 *      }
 *@apiErrorExample {json} Error Response-1
 *    HTTP/1.1 400 BAD REQUEST
 *    {
 *      "error": true,
 *      "message": "Invalid Request",
 *      "errorCode": "CNP-1",
 *      "errorType": "DataValidationError"
 *    }
 * @apiErrorExample {json} Error Response-3
 *    HTTP/1.1 500 INTERNAL SERVER ERROR
 *    {
 *      "error": true,
 *      "message": "Something went wrong, please try again later...",
 *      "errorCode": "CNP-2",
 *      "errorType": "UnknownError"
 *    }
 */
router.post('/create', decodeToken, checkUser, validateRequest('PC-CP-1', 'title', 'keyCode', 'ownerName', 'ownerId', 'type'), projectController.createProject);
router.post('/id', decodeToken, checkUser, validateRequest('PC-GP-1', 'projectId'), projectController.getProject);
router.post('/all', decodeToken, checkUser, projectController.constructQueryForGetProjects, projectController.getProjects);
router.post('/add-member', decodeToken, checkUser, validateRequest('PC-AMTP', 'projectId', 'user'), projectController.addMemberToProject);
router.post('/remove-member', decodeToken, checkUser, validateRequest('PC-RMFP', 'projectId', 'userId'), projectController.removeMemberFromProject);

module.exports = router;