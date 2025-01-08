const logger = require('../../../config/logger');
const mathjs = require('mathjs');
const natural = require('natural');

class ScoringEngine {
    /**
     * Score different question types
     */
    async scoreQuestion(question, answer) {
        try {
            switch (question.type) {
                case 'multiple-choice':
                case 'true-false':
                    return this.scoreMultipleChoice(question, answer);
                case 'matching':
                    return this.scoreMatching(question, answer);
                case 'fill-blank':
                    return this.scoreFillBlank(question, answer);
                case 'sequence':
                    return this.scoreSequence(question, answer);
                case 'hotspot':
                    return this.scoreHotspot(question, answer);
                case 'drag-drop':
                    return this.scoreDragDrop(question, answer);
                case 'audio-response':
                    return await this.scoreAudioResponse(question, answer);
                case 'math-equation':
                    return this.scoreMathEquation(question, answer);
                case 'diagram-label':
                    return this.scoreDiagramLabel(question, answer);
                case 'case-study':
                    return await this.scoreCaseStudy(question, answer);
                case 'peer-review':
                    return await this.scorePeerReview(question, answer);
                case 'essay':
                    return await this.scoreEssay(question, answer);
                case 'coding':
                    return await this.scoreCoding(question, answer);
                default:
                    throw new Error(`Unsupported question type: ${question.type}`);
            }
        } catch (error) {
            logger.error(`Error scoring question: ${error.message}`);
            return null;
        }
    }

    /**
     * New Question Type Scoring Methods
     */
    scoreSequence(question, answer) {
        const correctSequence = question.content.correctAnswer;
        const userSequence = answer.answer;

        if (!Array.isArray(userSequence) || userSequence.length !== correctSequence.length) {
            return 0;
        }

        let correctPositions = 0;
        for (let i = 0; i < correctSequence.length; i++) {
            if (correctSequence[i] === userSequence[i]) {
                correctPositions++;
            }
        }

        if (question.scoring.partialCredit) {
            return (correctPositions / correctSequence.length) * question.scoring.points;
        }
        return correctPositions === correctSequence.length ? question.scoring.points : 0;
    }

    scoreHotspot(question, answer) {
        const correctHotspots = question.content.media[0].hotspots;
        const userClicks = answer.answer;

        let correctClicks = 0;
        let incorrectClicks = 0;

        userClicks.forEach(click => {
            const isCorrect = correctHotspots.some(hotspot => 
                this.isPointInHotspot(click, hotspot)
            );
            if (isCorrect) {
                correctClicks++;
            } else {
                incorrectClicks++;
            }
        });

        if (question.scoring.partialCredit) {
            const score = (correctClicks / correctHotspots.length) - 
                         (incorrectClicks * 0.5 / correctHotspots.length);
            return Math.max(0, score * question.scoring.points);
        }
        return (correctClicks === correctHotspots.length && incorrectClicks === 0) 
            ? question.scoring.points : 0;
    }

    scoreDragDrop(question, answer) {
        const correctPlacements = question.content.correctAnswer;
        const userPlacements = answer.answer;

        let correctCount = 0;
        for (const [itemId, zoneId] of Object.entries(userPlacements)) {
            if (correctPlacements[itemId] === zoneId) {
                correctCount++;
            }
        }

        if (question.scoring.partialCredit) {
            return (correctCount / Object.keys(correctPlacements).length) * 
                   question.scoring.points;
        }
        return correctCount === Object.keys(correctPlacements).length ? 
               question.scoring.points : 0;
    }

    async scoreAudioResponse(question, answer) {
        try {
            // Implement speech-to-text and analysis
            const transcription = await this.transcribeAudio(answer.answer);
            const similarity = this.calculateTextSimilarity(
                transcription,
                question.content.correctAnswer
            );

            if (question.scoring.partialCredit) {
                return similarity * question.scoring.points;
            }
            return similarity > 0.8 ? question.scoring.points : 0;
        } catch (error) {
            logger.error('Error scoring audio response:', error);
            return null;
        }
    }

    scoreMathEquation(question, answer) {
        try {
            const correctEquation = mathjs.parse(question.content.correctAnswer);
            const userEquation = mathjs.parse(answer.answer);

            // Compare equations symbolically
            const isEquivalent = correctEquation.equals(userEquation);

            if (!isEquivalent && question.scoring.partialCredit) {
                // Test with sample values
                const testPoints = [-2, -1, 0, 1, 2];
                let correctValues = 0;

                for (const x of testPoints) {
                    const scope = { x };
                    const correctValue = correctEquation.evaluate(scope);
                    const userValue = userEquation.evaluate(scope);

                    if (Math.abs(correctValue - userValue) < 
                        (question.scoring.tolerance || 0.0001)) {
                        correctValues++;
                    }
                }

                return (correctValues / testPoints.length) * question.scoring.points;
            }

            return isEquivalent ? question.scoring.points : 0;
        } catch (error) {
            logger.error('Error scoring math equation:', error);
            return 0;
        }
    }

    scoreDiagramLabel(question, answer) {
        const correctLabels = question.content.correctAnswer;
        const userLabels = answer.answer;

        let correctCount = 0;
        let partialCount = 0;

        for (const [partId, label] of Object.entries(userLabels)) {
            if (correctLabels[partId]) {
                const similarity = this.calculateTextSimilarity(
                    label,
                    correctLabels[partId]
                );

                if (similarity === 1) {
                    correctCount++;
                } else if (similarity > 0.7) {
                    partialCount++;
                }
            }
        }

        if (question.scoring.partialCredit) {
            return ((correctCount + partialCount * 0.5) / 
                    Object.keys(correctLabels).length) * question.scoring.points;
        }
        return correctCount === Object.keys(correctLabels).length ? 
               question.scoring.points : 0;
    }

    async scoreCaseStudy(question, answer) {
        const subQuestions = question.content.subQuestions;
        const userAnswers = answer.answer;

        let totalScore = 0;
        for (const [subId, subAnswer] of Object.entries(userAnswers)) {
            const subQuestion = subQuestions.find(sq => sq.id === subId);
            if (subQuestion) {
                const subScore = await this.scoreQuestion(subQuestion, {
                    answer: subAnswer
                });
                totalScore += subScore || 0;
            }
        }

        return totalScore;
    }

    async scorePeerReview(question, answer) {
        if (!question.scoring.peerReview.enabled) {
            return null;
        }

        const reviews = answer.peerReviews || [];
        if (reviews.length < question.scoring.peerReview.minReviewers) {
            return null;
        }

        let weightedScore = 0;
        let totalWeight = 0;

        for (const review of reviews) {
            for (const [criterion, score] of Object.entries(review.scores)) {
                const weight = question.scoring.peerReview.rubric.find(
                    r => r.criterion === criterion
                )?.weight || 1;

                weightedScore += score * weight;
                totalWeight += weight;
            }
        }

        return (weightedScore / totalWeight) * question.scoring.points;
    }

    /**
     * Helper Methods
     */
    isPointInHotspot(point, hotspot) {
        const dx = point.x - hotspot.x;
        const dy = point.y - hotspot.y;
        return Math.sqrt(dx * dx + dy * dy) <= hotspot.radius;
    }

    calculateTextSimilarity(text1, text2) {
        const tokenizer = new natural.WordTokenizer();
        const tokens1 = tokenizer.tokenize(text1.toLowerCase());
        const tokens2 = tokenizer.tokenize(text2.toLowerCase());

        return natural.JaroWinklerDistance(tokens1.join(' '), tokens2.join(' '));
    }

    async transcribeAudio(audioData) {
        // Implement audio transcription
        // This would typically integrate with a speech-to-text service
        return 'transcribed text';
    }
}

module.exports = new ScoringEngine();
