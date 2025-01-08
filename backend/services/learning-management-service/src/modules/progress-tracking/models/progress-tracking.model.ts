import { Schema, model } from 'mongoose';

const progressTrackingSchema = new Schema({
    // Schema will be implemented
});

export const ProgressTracking = model('ProgressTracking', progressTrackingSchema);
