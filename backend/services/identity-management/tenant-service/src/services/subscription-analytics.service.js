// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\services\subscription-analytics.service.js

const { Subscription, SubscriptionHistory } = require('../models');
const { sequelize } = require('../database/connection');
const logger = require('../utils/logger');

class SubscriptionAnalyticsService {
  async getSubscriptionMetrics(startDate, endDate) {
    try {
      const metrics = await Promise.all([
        this.getRevenueMetrics(startDate, endDate),
        this.getChurnRate(startDate, endDate),
        this.getPlanDistribution(),
        this.getConversionMetrics(startDate, endDate)
      ]);

      return {
        revenue: metrics[0],
        churn: metrics[1],
        planDistribution: metrics[2],
        conversion: metrics[3],
        generatedAt: new Date()
      };
    } catch (error) {
      logger.error('Error generating subscription metrics:', error);
      throw error;
    }
  }

  async getRevenueMetrics(startDate, endDate) {
    const revenue = await Subscription.findAll({
      attributes: [
        [sequelize.fn('sum', sequelize.col('price')), 'totalRevenue'],
        'currency',
        'planType',
        [sequelize.fn('date_trunc', 'month', sequelize.col('createdAt')), 'month']
      ],
      where: {
        createdAt: {
          [sequelize.Op.between]: [startDate, endDate]
        },
        status: 'ACTIVE',
        isTrial: false
      },
      group: ['currency', 'planType', 'month'],
      order: [['month', 'ASC']]
    });

    return {
      total: revenue.reduce((acc, r) => acc + parseFloat(r.totalRevenue), 0),
      byPlan: revenue.reduce((acc, r) => {
        acc[r.planType] = (acc[r.planType] || 0) + parseFloat(r.totalRevenue);
        return acc;
      }, {}),
      monthly: revenue.map(r => ({
        month: r.month,
        revenue: parseFloat(r.totalRevenue),
        planType: r.planType
      }))
    };
  }

  async getChurnRate(startDate, endDate) {
    const [totalSubscriptions, cancelledSubscriptions] = await Promise.all([
      Subscription.count({
        where: {
          createdAt: {
            [sequelize.Op.lt]: endDate
          }
        }
      }),
      Subscription.count({
        where: {
          status: 'CANCELLED',
          updatedAt: {
            [sequelize.Op.between]: [startDate, endDate]
          }
        }
      })
    ]);

    return {
      rate: totalSubscriptions ? (cancelledSubscriptions / totalSubscriptions) * 100 : 0,
      cancelled: cancelledSubscriptions,
      total: totalSubscriptions
    };
  }

  async getPlanDistribution() {
    const distribution = await Subscription.findAll({
      attributes: [
        'planType',
        [sequelize.fn('count', sequelize.col('id')), 'count']
      ],
      where: {
        status: 'ACTIVE'
      },
      group: ['planType']
    });

    return distribution.reduce((acc, d) => {
      acc[d.planType] = parseInt(d.count);
      return acc;
    }, {});
  }

  async getConversionMetrics(startDate, endDate) {
    const trials = await Subscription.count({
      where: {
        isTrial: true,
        createdAt: {
          [sequelize.Op.between]: [startDate, endDate]
        }
      }
    });

    const conversions = await Subscription.count({
      where: {
        isTrial: false,
        status: 'ACTIVE',
        createdAt: {
          [sequelize.Op.between]: [startDate, endDate]
        }
      },
      include: [{
        model: SubscriptionHistory,
        as: 'history',
        where: {
          changeType: 'TRIAL_CONVERSION'
        }
      }]
    });

    return {
      trialCount: trials,
      conversionCount: conversions,
      conversionRate: trials ? (conversions / trials) * 100 : 0
    };
  }

  async getTenantUsageAnalytics(tenantId) {
    try {
      const subscription = await Subscription.findOne({
        where: {
          tenantId,
          status: 'ACTIVE'
        }
      });

      if (!subscription) {
        throw new Error('No active subscription found');
      }

      const history = await SubscriptionHistory.findAll({
        where: {
          subscriptionId: subscription.id
        },
        order: [['createdAt', 'DESC']]
      });

      // Analyze feature usage patterns
      const featureUsage = history.reduce((acc, record) => {
        if (record.changeType === 'FEATURE_ACCESS') {
          const feature = record.newValue.feature;
          acc[feature] = (acc[feature] || 0) + 1;
        }
        return acc;
      }, {});

      // Calculate upgrade potential
      const upgradePotential = await this.calculateUpgradePotential(subscription);

      return {
        currentPlan: subscription.planType,
        featureUsage,
        upgradePotential,
        subscriptionAge: Math.floor(
          (new Date() - new Date(subscription.createdAt)) / (1000 * 60 * 60 * 24)
        ),
        lastModified: subscription.updatedAt
      };
    } catch (error) {
      logger.error('Error generating tenant usage analytics:', error);
      throw error;
    }
  }

  async calculateUpgradePotential(subscription) {
    // Calculate upgrade potential based on usage patterns
    if (subscription.planType === 'ENTERPRISE') {
      return { recommended: false, reason: 'Already on highest tier' };
    }

    const usagePercentages = await Promise.all([
      this.calculateResourceUsage(subscription.tenantId, 'storage'),
      this.calculateResourceUsage(subscription.tenantId, 'users')
    ]);

    const [storageUsage, userUsage] = usagePercentages;

    if (subscription.planType === 'COMMUNITY' && 
        (storageUsage > 70 || userUsage > 70)) {
      return {
        recommended: true,
        targetPlan: 'PREMIUM',
        reason: 'High resource usage on Community plan'
      };
    }

    if (subscription.planType === 'PREMIUM' && 
        (storageUsage > 80 || userUsage > 80)) {
      return {
        recommended: true,
        targetPlan: 'ENTERPRISE',
        reason: 'Near resource limits on Premium plan'
      };
    }

    return {
      recommended: false,
      reason: 'Current plan suitable for usage patterns'
    };
  }

  async calculateResourceUsage(tenantId, resourceType) {
    // This would integrate with your usage tracking service
    // Returning mock data for now
    return Math.random() * 100;
  }
}

module.exports = new SubscriptionAnalyticsService();
