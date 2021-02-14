const mongoose = require('mongoose');
const shortId = require('shortid');

const NotificationSchema = mongoose.Schema({
  _id: {type: String, unique: true, required: true, default: shortId.generate},
  message: {type: String, required: true},
  userId: {type: String, required: true},
  sender: {type: {
    userId: String,
    firstName: String,
    lastName: String
  }, required: true},
  type: {type: String, required: true}, // issue or project
  status: {type: String, required: true, default: 'unread'}, // unread or read or later
  project: {type: {
    id: String,
    title: String
  }, required: false},
  issue: {type: {
    id: String,
    title: String
  }, required: false},
  priority: {type: String, required: true}, // low or high
  createdDate: {type: Date, required: true, default: Date.now}
});

module.exports = mongoose.model('Notification', NotificationSchema);
