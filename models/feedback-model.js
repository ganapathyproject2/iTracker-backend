const mongoose = require('mongoose');
const shortId = require('shortid');

const FeedbackSchema = mongoose.Schema({
  _id: {type: String, required: true, unique: true, default: shortId.generate},
  name: {type: String, required: true},
  userId: {type: String, required: true},
  query: {type: String, required: true},
  description: {type: String, required: true},
  email: {type: String, required: true},
  date: {type: String, required: true, default: Date.now}
});

module.exports = mongoose.model('Feedback', FeedbackSchema);
