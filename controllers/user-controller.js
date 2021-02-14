const User = require('../models/user-model');
const Project = require('../models/project-model');
const Feedback = require('../models/feedback-model');
const bcrypt = require('bcryptjs');
const {ErrorResponseBuilder, SuccessResponseBuilder} = require('../libraries/response-builder');
const jwt = require('jsonwebtoken');
const dateUtility = require('../libraries/date-formatter');
const logger = require('../libraries/log-message');
const mailService = require('../libraries/mail-service');
const { addMemberToDefaultProject } = require('./project-controller');

const createUser = (req, res, next) => {
  const isAdmin = (req.headers.isadmin) ? true : false;
  bcrypt.hash(req.body.password, 12)
        .then(hash => {
          const user = new User({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            password: hash,
            createdDate: dateUtility.formatDate(),
            hasAdminPrevilieges: isAdmin
          });
          user.save()
              .then(result => {
                let data = {
                  userId: result._id,
                  firstName: result.firstName,
                  lastName: result.lastName,
                };
                addMemberToDefaultProject(data);
                data.email = result.email;
                let response = new SuccessResponseBuilder('User created successfully!!!')
                                  .status(201)
                                  .data(data)
                                  .build();
                return res.status(201).send(response);
                })
              .catch(error => {
                logger.log(error, req, 'UC-CU');
                let err = new ErrorResponseBuilder().status(500).errorCode('CNU-3').errorType('UnknownError').build();
                return next(err);
              })
            })
}

const loginUser = (req, res, next) => {
    let fetchedUser;
    User.findOne({ email: req.body.email })
        .then(user => {
          if(!user) {
            let error = new ErrorResponseBuilder('Invalid username provided')
                                        .status(401)
                                        .errorType('OAuthError')
                                        .errorCode('LU-2')
                                        .build();
            return next(error);
          }
          if (user && user.isSocialAuthUser == true) {
            let error = new ErrorResponseBuilder('This Email ID is registered with social authentication. Please sign in through google authentication')
                              .status(400)
                              .errorType('OAuthError')
                              .errorCode('LU-5')
                              .build();
            return next(error);
          }
          fetchedUser = user;
          return bcrypt.compare(req.body.password, fetchedUser.password);
        })
        .then(result => {
            if(!result){
                let error = new ErrorResponseBuilder('Invalid Authentication Credentials')
                                        .status(401)
                                        .errorType('OAuthError')
                                        .errorCode('LU-3')
                                        .build();
                return next(error);
            }
            const token = jwt.sign({email: fetchedUser.email, firstName: fetchedUser.firstName, lastName: fetchedUser.lastName, id: fetchedUser._id, isAdmin: fetchedUser.hasAdminPrevilieges}, "secret", {expiresIn: '2h'});
            const data = {
                token: token,
                expiryDuration: 7200,
                username: fetchedUser.firstName + ' ' + fetchedUser.lastName,
                userId: fetchedUser._id,
                loginCount: fetchedUser.loginCount,
                isSocialAuthUser: false
            };
            incrementLoginCount(req.body.email, req, next);
            let jsonResponse = new SuccessResponseBuilder('User Logged In Successfully...').data(data).build();
            return res.status(200).send(jsonResponse);
        })
        .catch(error => {
            logger.log(error, req, 'UC-LU');
            console.log(error);
            let err = new ErrorResponseBuilder().status(500).errorCode('LU-4').errorType('UnknownError').build();
            return next(err);
        });
}

const incrementLoginCount = (email, req, next) => {
  User.findOneAndUpdate({email: email},
    {$inc: {loginCount: 1}})
    .then(docs => {
      // successfully updated
    })
    .catch(error => {
      logger.log(error, null, 'UC-ILC-1');
      let err = new ErrorResponseBuilder().status(500).errorCode('UI-3').errorType('UnknownError').build();
      return next(err);
    })
}

const socialLoginUser = (req, res, next) => {
  // check if user exists in our database
  /*if (userExists) {
      if (isSocialAuthUser) proceed with socialLogin
      else => throw an user already registered with this email id  
  } else {
    createSocialUser with dummy password, add isSocialAuthUser = true,
    send the login response
  }
  */
  User.findOne({email: req.body.email}, {isSocialAuthUser: 1, email: 1, firstName: 1, lastName: 1, loginCount: 1})
      .then(document => {
        return document;
      })
      .then(result => {
        if (result && result._id) {
          if (result.isSocialAuthUser && result.isSocialAuthUser == true) {
            const token = jwt.sign({email: result.email, firstName: result.firstName, lastName: result.lastName, id: result._id, isAdmin: result.hasAdminPrevilieges}, "secret", {expiresIn: '2h'});
            const data = {
                token: token,
                expiryDuration: 7200,
                username: result.firstName + ' ' + result.lastName,
                userId: result._id,
                loginCount: result.loginCount,
                isSocialAuthUser: true
            };
            incrementLoginCount(req.body.email, req, next);
            let jsonResponse = new SuccessResponseBuilder('User Logged In Successfully...').data(data).build();
            return res.status(200).send(jsonResponse);
          } else {
            let error = new ErrorResponseBuilder('Email is already registered in the application. Please sign in from normal login')
                                        .status(400)
                                        .errorType('OAuthError')
                                        .errorCode('UC-SLU-5')
                                        .build();
            return next(error);
          }
        } else {
          // new user
          const user = new User({
            email: req.body.email,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            password: `${process.env.SECURE_PWD}`,
            isSocialAuthUser: true
          });
          user.save()
              .then(data => {
                const token = jwt.sign({email: data.email, firstName: data.firstName, lastName: data.lastName, id: data._id, isAdmin: data.hasAdminPrevilieges}, "secret", {expiresIn: '2h'});
                const obj = {
                    token: token,
                    expiryDuration: 7200,
                    username: data.firstName + ' ' + data.lastName,
                    userId: data._id,
                    loginCount: data.loginCount,
                    isSocialAuthUser: true
                };
                let userBasicData = {
                  userId: data._id,
                  firstName: data.firstName,
                  lastName: data.lastName
                };
                addMemberToDefaultProject(userBasicData);
                incrementLoginCount(req.body.email, req, next);
                let jsonResponse = new SuccessResponseBuilder('User Logged In Successfully...').data(obj).build();
                return res.status(200).send(jsonResponse);
              })
              .catch(error => {
                logger.log(error, req, 'UC-SLU');
                let err = new ErrorResponseBuilder().status(500).errorCode('UC-SLU-5').errorType('UnknownError').build();
                return next(err);
              });
        }
      })
      .catch(error => {
        logger.log(error, req, 'UC-SLU');
        let err = new ErrorResponseBuilder().status(500).errorCode('UC-SLU-1').errorType('UnknownError').build();
        return next(err);
      });
}

const getUserStats = (req, res, next) => {
  User.findById(req.body.userId, {password: 0})
      .then(doc => {
        if (doc == null || typeof doc == 'undefined') {
          let response = new ErrorResponseBuilder('There is no user with id ' + req.body.userId)
                              .errorCode('ST-1')
                              .errorType('DataNotFoundError')
                              .build();
          return res.status(404).send(response);
        }
        return {userId: doc._id, firstName: doc.firstName, lastName: doc.lastName};
      })
      .then(userData => {
        Project.find({$or: [{ownerId: userData.userId}, {members: {$elemMatch: {userId: userData.userId}}}]})
                .then(docs => {
                  userData.projectDetails = docs.map(doc => {
                    let obj = {
                      title: doc.title,
                      projectId: doc._id
                    };
                    return obj;
                  });
                  let jsonResponse = new SuccessResponseBuilder('User Stats Fetched Successfully!!!').data(userData).build();
                  res.status(200).send(jsonResponse);
                })
                .catch(error => {
                  logger.log(error, req, 'UC-GUS');
                  let err = new ErrorResponseBuilder().status(500).errorCode('UC-GUS-3').errorType('UnknownError').build();
                  return next(err);
                })
      })
      .catch(error => {
        logger.log(error, req, 'UC-GU');
        let err = new ErrorResponseBuilder().status(500).errorCode('UC-GU-4').errorType('UnknownError').build();
        return next(err);
      })
}

const getUser = (req, res, next) => {
    User.findById(req.userData.userId)
        .exec()
        .then(result => {
            let data = {
                userId: result._id,
                firstName: result.firstName,
                lastName: result.lastName,
                email: result.email,
                createdOn: result.createdDate
            }
            let jsonResponse = new SuccessResponseBuilder('User Data Fetched Successfully!!!').data(data).build();
            res.status(200).send(jsonResponse);
        })
        .catch(error => {
            logger.log(error, req, 'UC-GU');
            let err = new ErrorResponseBuilder().status(500).errorCode('UC-GU-3').errorType('UnknownError').build();
            return next(err);
        })
}

const getAllUsers = (req, res, next) => {
  User.find({hasAdminPrevilieges: false},{firstName: 1, lastName: 1, _id: 1})
      .then(result => {
        let customResponse = result.map(user => {
          let obj = {
            userId: user._id,
            firstName: user.firstName,
            lastName: user.lastName
          };
          return obj;
        });
        let jsonResponse = new SuccessResponseBuilder('Users data fetched successfully!!!').data(customResponse).build();
        res.status(200).send(jsonResponse);
      })
      .catch(error => {
        logger.log(error, req, 'UC-GAU');
        let err = new ErrorResponseBuilder().status(500).errorCode('UC-GAU-1').errorType('UnknownError').build();
        return next(err);
      })
}
 
const getUserNotifications = (req, res, next) => {
  User.findOne({_id: req.userData.userId},{notifications: 1})
      .exec()
      .then(result => {
        let jsonResponse = new SuccessResponseBuilder('User notifications fetched successfully!!!').data(result.notifications).build();
        res.status(200).send(jsonResponse);
      })
      .catch(error => {
        logger.log(error, req, 'GUN-1');
        let err = new ErrorResponseBuilder().status(500).errorCode('GUN-1').errorType('UnknownError').build();
        return next(err);
      })
}

const sendUserFeedback = (req, res, next) => {
  const feedbackData = {
    name: req.body.userName,
    query: req.body.query,
    description: req.body.description,
    userId: req.userData.userId,
    email: req.userData.email
  };
  const feedback = new Feedback(feedbackData);
  feedback.save()
    .then(result => {
      mailService.sendFeedback(feedbackData);
      let jsonResponse = new SuccessResponseBuilder('Thanks for your time, We will reach out to you soon!!!').data().build();
      res.status(200).send(jsonResponse);
    })
    .catch(error => {
      logger.log(error, req, 'PF-2');
      let err = new ErrorResponseBuilder().status(500).errorCode('PF-2').errorType('UnknownError').build();
      return next(err);
    })
}

const updateUserPersonalInfo = (req, res, next) => {
  User.findOneAndUpdate({_id: req.userData.userId},
                        {$set: {firstName: req.body.firstName, lastName: req.body.lastName}},
                        {new: true})
      .then(docs => {
        if(docs.firstName) {
          let obj = {
            firstName: docs.firstName,
            lastName: docs.lastName
          };
          let jsonResponse = new SuccessResponseBuilder('Successfully updated!!!').data(obj).build();
          res.status(200).send(jsonResponse);
        } else {
          logger.log(docs, req, 'UI-2');
          let err = new ErrorResponseBuilder('Unable to update your details!!! Please try again later...').status(500).errorCode('UI-3').errorType('UnknownError').build();
          return next(err);
        }

      })
      .catch(error => {
        logger.log(error, req, 'UI-3');
        let err = new ErrorResponseBuilder().status(500).errorCode('UI-3').errorType('UnknownError').build();
        return next(err);
      })
}

const requestUserPassword = (req, res, next) => {
  User.countDocuments({email: req.body.email})
      .exec()
      .then(docsCount => {
        if(docsCount > 0) {
          // send recovery link to provided email
          const token = jwt.sign({email: req.body.email}, "secret", {expiresIn: '1h'});
          const mailData = {
            email: req.body.email,
            verificationCode: token
          };
          mailService.sendRecoveryMail(mailData);
          let jsonResponse = new SuccessResponseBuilder('We have sent a revocery code to your registered mail. Please check your mail and follow the steps mentioned!!!').data().build();
          res.status(200).send(jsonResponse);
        } else {
          // no user found with the email provided
          let error = new ErrorResponseBuilder('No user found with the provided email Id, please check again the email provided!!!').status(404).errorType('DataNotFoundError').errorCode('RE-2').build();
          return next(error);
        }
      })
      .catch(error => {
        logger.log(error, req, 'RE-3');
        let err = new ErrorResponseBuilder().status(500).errorCode('RE-3').errorType('UnknownError').build(); 
        return next(err);
      })
}

const resetPassword = (req, res, next) => {
  const token = `${req.body.verificationCode}`;
  let decodedToken = '';
  // jwt.verify in synchronous mode will throw error incase of invalid token
  try {
    decodedToken = jwt.verify(token, "secret");
    let email = decodedToken.email;
    bcrypt.hash(req.body.newPassword, 12)
          .then(hash => {
            User.findOneAndUpdate({email: email},{password: hash})
                .then(result => {
                  let jsonResponse = new SuccessResponseBuilder('Password updated successfully!!! Please login with your new password...').data().build();
                  res.status(200).send(jsonResponse);
                })
                .catch(err => {
                  logger.log(err, req, 'UC-RP-2');
                  console.log(err);
                  let error = new ErrorResponseBuilder('Something went wrong, please try again later!!!').errorCode('UC-RP-2').errorType('UnknownError').build();
                  return next(error);
                })
          })
          .catch(err => {
            logger.log(err, req, 'RE-4');
            let error = new ErrorResponseBuilder('Something went wrong, please try again later!!!').errorCode('RE-4').errorType('UnknownError').build();
            return next(error);
          })
  } catch(err) {
    logger.log(err, req, 'RE-5');
    let error = new ErrorResponseBuilder('Please provide correct verification code!!!').errorCode('RE-5').errorType('OAuthError').build();
    return res.status(400).send(error);
  }
}

module.exports = {
  createUser: createUser,
  loginUser: loginUser,
  getUser: getUser,
  getUserStats: getUserStats,
  getAllUsers: getAllUsers,
  sendUserFeedback: sendUserFeedback,
  updateUserPersonalInfo: updateUserPersonalInfo,
  requestUserPassword: requestUserPassword,
  resetPassword: resetPassword,
  socialLoginUser: socialLoginUser
}