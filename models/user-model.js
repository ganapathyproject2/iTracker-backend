const mongoose = require('mongoose');
const shortId = require('shortid');

const userSchema = mongoose.Schema({
    _id: {type: String, unique: true, required: true, default: shortId.generate},
    firstName: {type: String, required: true, trim: true},
    lastName: {type: String, required: true, trim: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    createdDate: {type: Date, default: Date.now, required: false},
    hasAdminPrevilieges: {type: Boolean, default: false},
    notifications: [{
      message: {type:String, required: true},
      arrived: {type: Date, default: Date.now},
      readStatus: {type: String, default: 'unread'}
    }],
    loginCount: {type: Number, default: 0},
    isSocialAuthUser: {type: Boolean, required: true, default: false}
});

userSchema.index({email: 1});

module.exports = mongoose.model('User', userSchema);

