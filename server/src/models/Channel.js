import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['owner', 'admin', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const channelSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['dm', 'group', 'channel'],
      required: true,
    },
    name: {
      type: String,
      trim: true,
      maxlength: 80,
      default: null,
    },
    topic: {
      type: String,
      maxlength: 250,
      default: '',
    },
    isPrivate: {
      type: Boolean,
      default: true,
    },
    // Sorted "<userIdA>_<userIdB>" — only set for type:'dm'. The unique+sparse
    // index makes get-or-create atomic instead of racing on an array scan.
    dmKey: {
      type: String,
      default: null,
    },
    members: {
      type: [memberSchema],
      validate: (v) => v.length > 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    avatarUrl: {
      type: String,
      default: null,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

channelSchema.index({ 'members.user': 1 });
channelSchema.index({ dmKey: 1 }, { unique: true, sparse: true });
channelSchema.index({ lastMessageAt: -1 });

export function makeDmKey(userIdA, userIdB) {
  return [userIdA.toString(), userIdB.toString()].sort().join('_');
}

export const Channel = mongoose.model('Channel', channelSchema);
