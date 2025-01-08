const { Assessment } = require('../models/assessment.model');
const logger = require('../../../config/logger');
const stats = require('simple-statistics');

class AnalyticsEngine {
    /**
     * Performance Analytics
     */
    async calculatePerformanceMetrics(assessmentId) {
        try {
            const assessment = await Assessment.findById(assessmentId)
                .populate('submissions');

            const scores = assessment.submissions.map(s => s.score);
            
            return {
                averageScore: stats.mean(scores),
                medianScore: stats.median(scores),
                standardDeviation: stats.standardDeviation(scores),
                percentiles: {
                    25: stats.quantile(scores, 0.25),
                    50: stats.quantile(scores, 0.50),
                    75: stats.quantile(scores, 0.75)
                },
                distribution: this.calculateDistribution(scores),
                reliability: await this.calculateReliability(assessment),
                skillGaps: await this.identifySkillGaps(assessment)
            };
        } catch (error) {
            logger.error('Error calculating performance metrics:', error);
            return null;
        }
    }

    /**
     * Question Analytics
     */
    async calculateQuestionMetrics(assessmentId) {
        try {
            const assessment = await Assessment.findById(assessmentId)
                .populate('submissions');

            const questionMetrics = [];
            for (const question of assessment.questions) {
                const metrics = await this.analyzeQuestion(question, assessment.submissions);
                questionMetrics.push({
                    questionId: question._id,
                    ...metrics
                });
            }

            return questionMetrics;
        } catch (error) {
            logger.error('Error calculating question metrics:', error);
            return null;
        }
    }

    /**
     * Time Analytics
     */
    async calculateTimeMetrics(assessmentId) {
        try {
            const assessment = await Assessment.findById(assessmentId)
                .populate('submissions');

            const times = assessment.submissions.map(s => s.duration);
            const questionTimes = this.calculateQuestionTimes(assessment);

            return {
                averageTime: stats.mean(times),
                medianTime: stats.median(times),
                timeDistribution: this.calculateDistribution(times),
                questionTimes,
                speedAccuracyCorrelation: this.calculateSpeedAccuracyCorrelation(
                    assessment.submissions
                ),
                timeManagementPatterns: this.analyzeTimeManagement(
                    assessment.submissions
                )
            };
        } catch (error) {
            logger.error('Error calculating time metrics:', error);
            return null;
        }
    }

    /**
     * Engagement Analytics
     */
    async calculateEngagementMetrics(assessmentId) {
        try {
            const assessment = await Assessment.findById(assessmentId)
                .populate('submissions');

            return {
                completionRate: this.calculateCompletionRate(assessment),
                averageAttempts: this.calculateAverageAttempts(assessment),
                hintUsage: this.analyzeHintUsage(assessment),
                dropoffPoints: this.identifyDropoffPoints(assessment),
                userBehavior: await this.analyzeUserBehavior(assessment),
                accessibility: this.analyzeAccessibilityUsage(assessment)
            };
        } catch (error) {
            logger.error('Error calculating engagement metrics:', error);
            return null;
        }
    }

    /**
     * Helper Methods
     */
    calculateDistribution(values, bins = 10) {
        const min = Math.min(...values);
        const max = Math.max(...values);
        const binSize = (max - min) / bins;
        const distribution = new Array(bins).fill(0);

        values.forEach(value => {
            const binIndex = Math.min(
                Math.floor((value - min) / binSize),
                bins - 1
            );
            distribution[binIndex]++;
        });

        return {
            bins: distribution,
            binSize,
            min,
            max
        };
    }

    async calculateReliability(assessment) {
        const itemScores = assessment.submissions.map(sub =>
            assessment.questions.map(q =>
                sub.answers.find(a => a.questionId.equals(q._id))?.score || 0
            )
        );

        return {
            cronbachAlpha: this.calculateCronbachAlpha(itemScores),
            itemTotalCorrelations: this.calculateItemTotalCorrelations(itemScores)
        };
    }

    calculateCronbachAlpha(itemScores) {
        const k = itemScores[0].length;
        const itemVariances = itemScores[0].map((_, i) =>
            stats.variance(itemScores.map(scores => scores[i]))
        );
        const totalVariance = stats.variance(
            itemScores.map(scores => scores.reduce((a, b) => a + b, 0))
        );
        const sumItemVariances = itemVariances.reduce((a, b) => a + b, 0);

        return (k / (k - 1)) * (1 - sumItemVariances / totalVariance);
    }

    calculateItemTotalCorrelations(itemScores) {
        const totalScores = itemScores.map(scores =>
            scores.reduce((a, b) => a + b, 0)
        );

        return itemScores[0].map((_, i) => {
            const itemScoresForQuestion = itemScores.map(scores => scores[i]);
            return stats.sampleCorrelation(itemScoresForQuestion, totalScores);
        });
    }

    async identifySkillGaps(assessment) {
        const skillGaps = new Map();

        for (const submission of assessment.submissions) {
            for (const answer of submission.answers) {
                const question = assessment.questions.id(answer.questionId);
                const skills = question.metadata.skills || [];

                skills.forEach(skill => {
                    const current = skillGaps.get(skill) || {
                        total: 0,
                        incorrect: 0
                    };

                    current.total++;
                    if (answer.score === 0) {
                        current.incorrect++;
                    }

                    skillGaps.set(skill, current);
                });
            }
        }

        return Array.from(skillGaps.entries()).map(([skill, data]) => ({
            skill,
            gap: data.incorrect / data.total,
            frequency: data.total
        }));
    }

    async analyzeQuestion(question, submissions) {
        const answers = submissions.flatMap(s =>
            s.answers.filter(a => a.questionId.equals(question._id))
        );

        const scores = answers.map(a => a.score);
        const maxScore = question.scoring.points;

        return {
            difficulty: 1 - stats.mean(scores) / maxScore,
            discrimination: this.calculateDiscrimination(
                answers,
                submissions,
                maxScore
            ),
            averageTime: stats.mean(answers.map(a => a.timeSpent)),
            commonMistakes: this.analyzeCommonMistakes(answers, question),
            hintEffectiveness: this.calculateHintEffectiveness(answers)
        };
    }

    calculateDiscrimination(answers, submissions, maxScore) {
        const totalScores = submissions.map(s =>
            s.answers.reduce((sum, a) => sum + a.score, 0)
        );
        const median = stats.median(totalScores);

        const highGroup = answers.filter(a =>
            submissions.find(s =>
                s.answers.includes(a) &&
                s.answers.reduce((sum, ans) => sum + ans.score, 0) > median
            )
        );

        const lowGroup = answers.filter(a =>
            submissions.find(s =>
                s.answers.includes(a) &&
                s.answers.reduce((sum, ans) => sum + ans.score, 0) <= median
            )
        );

        const highMean = stats.mean(highGroup.map(a => a.score)) / maxScore;
        const lowMean = stats.mean(lowGroup.map(a => a.score)) / maxScore;

        return highMean - lowMean;
    }

    analyzeCommonMistakes(answers, question) {
        const mistakes = new Map();

        answers.forEach(answer => {
            if (answer.score < question.scoring.points) {
                const key = this.getMistakeKey(answer, question);
                mistakes.set(key, (mistakes.get(key) || 0) + 1);
            }
        });

        return Array.from(mistakes.entries())
            .map(([pattern, frequency]) => ({ pattern, frequency }))
            .sort((a, b) => b.frequency - a.frequency)
            .slice(0, 5);
    }

    getMistakeKey(answer, question) {
        switch (question.type) {
            case 'multiple-choice':
                return answer.answer.sort().join(',');
            case 'matching':
                return Object.entries(answer.answer)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([k, v]) => `${k}:${v}`)
                    .join(';');
            default:
                return String(answer.answer);
        }
    }

    calculateHintEffectiveness(answers) {
        const withHints = answers.filter(a => a.hintsUsed?.length > 0);
        const withoutHints = answers.filter(a => !a.hintsUsed?.length);

        return {
            withHints: stats.mean(withHints.map(a => a.score)),
            withoutHints: stats.mean(withoutHints.map(a => a.score)),
            hintUsageRate: withHints.length / answers.length
        };
    }

    calculateQuestionTimes(assessment) {
        const times = assessment.questions.map(question => {
            const questionTimes = assessment.submissions.flatMap(s =>
                s.answers
                    .filter(a => a.questionId.equals(question._id))
                    .map(a => a.timeSpent)
            );

            return {
                questionId: question._id,
                averageTime: stats.mean(questionTimes),
                medianTime: stats.median(questionTimes),
                distribution: this.calculateDistribution(questionTimes)
            };
        });

        return times;
    }

    calculateSpeedAccuracyCorrelation(submissions) {
        const pairs = submissions.map(s => ({
            speed: s.duration,
            accuracy: s.score
        }));

        return stats.sampleCorrelation(
            pairs.map(p => p.speed),
            pairs.map(p => p.accuracy)
        );
    }

    analyzeTimeManagement(submissions) {
        return {
            earlyFinishers: submissions.filter(s => 
                s.duration < s.assessment.settings.timeLimit * 0.5
            ).length,
            lastMinuteRush: submissions.filter(s =>
                s.duration > s.assessment.settings.timeLimit * 0.9
            ).length,
            timeoutRate: submissions.filter(s =>
                s.duration >= s.assessment.settings.timeLimit
            ).length / submissions.length
        };
    }

    calculateCompletionRate(assessment) {
        const totalQuestions = assessment.questions.length;
        const completionRates = assessment.submissions.map(s =>
            s.answers.length / totalQuestions
        );

        return stats.mean(completionRates);
    }

    calculateAverageAttempts(assessment) {
        const attempts = assessment.submissions.map(s =>
            s.answers.reduce((sum, a) => sum + (a.attempts || 1), 0) / s.answers.length
        );

        return stats.mean(attempts);
    }

    analyzeHintUsage(assessment) {
        const hintUsage = assessment.submissions.flatMap(s =>
            s.answers.filter(a => a.hintsUsed?.length > 0)
        );

        return {
            totalHints: hintUsage.reduce((sum, a) => sum + a.hintsUsed.length, 0),
            averageHintsPerQuestion: hintUsage.length / assessment.questions.length,
            hintEffectiveness: this.calculateHintEffectiveness(
                assessment.submissions.flatMap(s => s.answers)
            )
        };
    }

    identifyDropoffPoints(assessment) {
        const questionCompletions = assessment.questions.map((_, i) => {
            const completed = assessment.submissions.filter(s =>
                s.answers.length > i
            ).length;
            return {
                questionNumber: i + 1,
                completionRate: completed / assessment.submissions.length
            };
        });

        return questionCompletions.filter((q, i, arr) =>
            i > 0 && (arr[i - 1].completionRate - q.completionRate) > 0.1
        );
    }

    async analyzeUserBehavior(assessment) {
        const behaviors = assessment.submissions.map(s => ({
            timePerQuestion: s.answers.map(a => a.timeSpent),
            revisions: s.answers.map(a => a.revisions?.length || 0),
            navigationPattern: s.navigationHistory || []
        }));

        return {
            averageRevisions: stats.mean(
                behaviors.flatMap(b => b.revisions)
            ),
            navigationPatterns: this.analyzeNavigationPatterns(
                behaviors.map(b => b.navigationPattern)
            ),
            timeDistribution: this.analyzeTimeDistribution(
                behaviors.map(b => b.timePerQuestion)
            )
        };
    }

    analyzeNavigationPatterns(patterns) {
        const sequences = patterns.map(p =>
            p.map((q, i) => i > 0 ? q - p[i - 1] : 0)
        );

        return {
            linearProgress: sequences.filter(s =>
                s.every(move => move === 1)
            ).length / patterns.length,
            reviewRate: sequences.filter(s =>
                s.some(move => move < 0)
            ).length / patterns.length,
            skipRate: sequences.filter(s =>
                s.some(move => move > 1)
            ).length / patterns.length
        };
    }

    analyzeTimeDistribution(timeArrays) {
        const flattened = timeArrays.flat();
        return {
            fastAnswers: flattened.filter(t => t < 10).length,
            thoughtfulAnswers: flattened.filter(t => t >= 10 && t < 60).length,
            longAnswers: flattened.filter(t => t >= 60).length
        };
    }

    analyzeAccessibilityUsage(assessment) {
        const accessibilityFeatures = assessment.submissions.map(s =>
            s.accessibilityFeaturesUsed || []
        );

        const featureCounts = new Map();
        accessibilityFeatures.flat().forEach(feature => {
            featureCounts.set(feature, (featureCounts.get(feature) || 0) + 1);
        });

        return {
            totalUsage: accessibilityFeatures.flat().length,
            featureBreakdown: Object.fromEntries(featureCounts),
            userCount: accessibilityFeatures.filter(f => f.length > 0).length
        };
    }
}

module.exports = new AnalyticsEngine();
