import { Schema, model } from 'mongoose';

const learningPathSchema = new Schema({
    // Schema will be implemented
});

export const LearningPath = model('LearningPath', learningPathSchema);
