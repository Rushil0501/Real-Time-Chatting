import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 32,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 64,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    avatarUrl: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      maxlength: 280,
      default: '',
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

userSchema.index({ username: 'text', displayName: 'text' });

export const User = mongoose.model('User', userSchema);
