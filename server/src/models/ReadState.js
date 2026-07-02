import mongoose from 'mongoose';

const readStateSchema = new mongoose.Schema(
  {
    channel: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lastReadMessageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
    lastReadAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

readStateSchema.index({ channel: 1, user: 1 }, { unique: true });

export const ReadState = mongoose.model('ReadState', readStateSchema);
