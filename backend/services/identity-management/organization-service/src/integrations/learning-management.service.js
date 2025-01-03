// \d\DREAM\bodhi-learn\backend\services\identity-management\organization-service\src\integrations\learning-management.service.js

const axios = require('axios');
const config = require('../config');
const { IntegrationError } = require('../utils/errors/custom-error');
const logger = require('../utils/logger');

class LearningManagementService {
  constructor() {
    this.client = axios.create({
      baseURL: config.services.learning.baseUrl,
      headers: {
        'x-api-key': config.services.learning.apiKey,
        'Content-Type': 'application/json'
      }
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response.data,
      error => this.handleError(error)
    );
  }

  /**
   * Handle API errors
   */
  handleError(error) {
    const errorData = {
      service: 'learning-management',
      endpoint: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data
    };

    logger.error('Learning Management Service Error:', errorData);

    throw new IntegrationError(
      error.response?.data?.message || 'Learning Management Service Error',
      errorData
    );
  }

  /**
   * Create a program in learning management service
   */
  async createProgram(programData) {
    try {
      const response = await this.client.post('/programs', programData);
      return response;
    } catch (error) {
      throw new IntegrationError('Failed to create program in LMS', error);
    }
  }

  /**
   * Update a program in learning management service
   */
  async updateProgram(programId, updateData) {
    try {
      const response = await this.client.put(`/programs/${programId}`, updateData);
      return response;
    } catch (error) {
      throw new IntegrationError('Failed to update program in LMS', error);
    }
  }

  /**
   * Delete a program from learning management service
   */
  async deleteProgram(programId) {
    try {
      await this.client.delete(`/programs/${programId}`);
      return true;
    } catch (error) {
      throw new IntegrationError('Failed to delete program from LMS', error);
    }
  }

  /**
   * Get program statistics from learning management service
   */
  async getProgramStats(programId) {
    try {
      const response = await this.client.get(`/programs/${programId}/stats`);
      return response;
    } catch (error) {
      throw new IntegrationError('Failed to get program stats from LMS', error);
    }
  }

  /**
   * Sync calendar events with learning management service
   */
  async syncCalendarEvents(calendarId, events) {
    try {
      const response = await this.client.post(`/calendars/${calendarId}/sync`, { events });
      return response;
    } catch (error) {
      throw new IntegrationError('Failed to sync calendar events with LMS', error);
    }
  }

  /**
   * Get learning activities for a date range
   */
  async getLearningActivities(startDate, endDate, filters = {}) {
    try {
      const response = await this.client.get('/activities', {
        params: {
          startDate,
          endDate,
          ...filters
        }
      });
      return response;
    } catch (error) {
      throw new IntegrationError('Failed to get learning activities from LMS', error);
    }
  }

  /**
   * Get course schedule for a term
   */
  async getTermSchedule(termId) {
    try {
      const response = await this.client.get(`/terms/${termId}/schedule`);
      return response;
    } catch (error) {
      throw new IntegrationError('Failed to get term schedule from LMS', error);
    }
  }
}

module.exports = new LearningManagementService();
