import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    kind: {
      type: String,
      enum: ['image', 'video', 'audio', 'file'],
      required: true,
    },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Channel',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      maxlength: 4000,
      default: '',
    },
    attachments: {
      type: [attachmentSchema],
      default: [],
    },
    editedAt: {
      type: Date,
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Cursor pagination by _id (roughly time-ordered via ObjectId) scoped to a channel.
messageSchema.index({ channel: 1, _id: -1 });

export const Message = mongoose.model('Message', messageSchema);
