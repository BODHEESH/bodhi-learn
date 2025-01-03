// \d\DREAM\bodhi - learn\backend\models\mongodb\StudentPerformance.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const evaluationResultSchema = new Schema({
    evaluationId: {
        type: Schema.Types.ObjectId,
        required: true
    },
    type: {
        type: String,
        enum: ['quiz', 'test', 'exam', 'project', 'assignment']
    },
    score: Number,
    maxScore: Number,
    percentage: Number,
    feedback: String,
    submittedAt: Date,
    gradedBy: String,
    gradedAt: Date
});

const studentPerformanceSchema = new Schema({
    institutionId: {
        type: String,
        required: true,
        index: true
    },
    studentId: {
        type: String,
        required: true
    },
    classId: {
        type: Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    },
    courseId: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    attendanceStats: {
        totalClasses: Number,
        present: Number,
        absent: Number,
        late: Number,
        excused: Number,
        attendancePercentage: Number
    },
    evaluations: [evaluationResultSchema],
    aggregates: {
        currentGrade: String,
        percentage: Number,
        rank: Number,
        lastUpdated: Date
    },
    progressTracking: [{
        date: Date,
        metric: String,
        value: Number,
        change: Number // percentage change from last measurement
    }],
    feedback: [{
        teacherId: String,
        comment: String,
        date: Date,
        category: {
            type: String,
            enum: ['academic', 'behavior', 'participation', 'improvement']
        }
    }],
    metadata: {
        type: Map,
        of: Schema.Types.Mixed
    }
}, {
    timestamps: true,
    collection: 'student_performances'
});

// Indexes
studentPerformanceSchema.index({ institutionId: 1, studentId: 1, classId: 1 }, { unique: true });
studentPerformanceSchema.index({ 'aggregates.currentGrade': 1 });
studentPerformanceSchema.index({ 'aggregates.percentage': 1 });
studentPerformanceSchema.index({ 'attendanceStats.attendancePercentage': 1 });

const StudentPerformance = mongoose.model('StudentPerformance', studentPerformanceSchema);
module.exports = StudentPerformance;
