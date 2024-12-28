-- PostgreSQL Schema with All Improvements

-- 1. Core Tenant Management with Enhancements
CREATE TABLE tenants (
    tenant_id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE,
    logo_url TEXT,
    branding_config JSONB,
    feature_flags JSONB,
    custom_config JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    address TEXT,
    theme_settings JSONB,
    tenant_type VARCHAR(20) CHECK (tenant_type IN ('educational', 'corporate', 'individual')),
    read_replica_config JSONB,
    encryption_keys JSONB,
    compliance_settings JSONB
) PARTITION BY RANGE (created_at);

-- Create partition
CREATE TABLE tenants_2024 PARTITION OF tenants
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

-- 2. Enhanced User Management
CREATE TABLE users (
    user_id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) REFERENCES tenants(tenant_id),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(20) CHECK (role IN ('admin', 'instructor', 'student', 'mentor')),
    profile_picture TEXT,
    phone VARCHAR(50),
    preferences JSONB,
    accessibility_settings JSONB,
    timezone VARCHAR(50),
    language_preferences JSONB,
    email_verified BOOLEAN DEFAULT false,
    social_auth_data JSONB,
    gamification_level INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    achievements_unlocked JSONB,
    mentor_specialties JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INTEGER DEFAULT 0,
    security_questions JSONB,
    mfa_settings JSONB
) PARTITION BY RANGE (created_at);

-- 3. Enhanced Course Management with Versioning
CREATE TABLE courses (
    course_id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) REFERENCES tenants(tenant_id),
    current_version_id VARCHAR(36),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_published BOOLEAN DEFAULT false
) PARTITION BY RANGE (created_at);

CREATE TABLE course_versions (
    version_id VARCHAR(36) PRIMARY KEY,
    course_id VARCHAR(36) REFERENCES courses(course_id),
    version_number INTEGER,
    curriculum_snapshot JSONB,
    instructor_id VARCHAR(36) REFERENCES users(user_id),
    thumbnail TEXT,
    difficulty_level VARCHAR(20),
    prerequisites JSONB,
    learning_objectives JSONB,
    duration_hours INTEGER,
    status VARCHAR(20),
    language_versions JSONB,
    enrollment_limit INTEGER,
    pricing_tiers JSONB,
    changes_summary TEXT,
    effective_from TIMESTAMP WITH TIME ZONE,
    effective_to TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Content Management with Versioning
CREATE TABLE content (
    content_id VARCHAR(36) PRIMARY KEY,
    current_version_id VARCHAR(36),
    module_id VARCHAR(36),
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

CREATE TABLE content_versions (
    version_id VARCHAR(36) PRIMARY KEY,
    content_id VARCHAR(36) REFERENCES content(content_id),
    version_number INTEGER,
    content_data JSONB,
    content_type VARCHAR(50),
    url TEXT,
    offline_data JSONB,
    language_versions JSONB,
    accessibility_features JSONB,
    interactive_elements JSONB,
    changelog TEXT,
    created_by VARCHAR(36) REFERENCES users(user_id),
    created_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT false
);

-- 5. Learning Path Enhancement
CREATE TABLE learning_path_templates (
    template_id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) REFERENCES tenants(tenant_id),
    name VARCHAR(255),
    description TEXT,
    skills_framework JSONB,
    prerequisite_rules JSONB,
    advancement_criteria JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE learning_paths (
    path_id VARCHAR(36) PRIMARY KEY,
    template_id VARCHAR(36) REFERENCES learning_path_templates(template_id),
    user_id VARCHAR(36) REFERENCES users(user_id),
    progress_data JSONB,
    current_stage JSONB,
    completion_status VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Performance and Caching
CREATE TABLE cache_metadata (
    cache_key VARCHAR(255) PRIMARY KEY,
    entity_type VARCHAR(50),
    entity_id VARCHAR(36),
    last_updated TIMESTAMP WITH TIME ZONE,
    cache_version INTEGER,
    invalidation_rules JSONB
);

CREATE TABLE analytics_aggregates (
    aggregate_id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) REFERENCES tenants(tenant_id),
    metric_type VARCHAR(50),
    timeframe VARCHAR(20),
    aggregated_data JSONB,
    calculated_at TIMESTAMP WITH TIME ZONE
) PARTITION BY RANGE (calculated_at);

-- 7. AI and ML Integration
CREATE TABLE ai_model_configs (
    config_id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) REFERENCES tenants(tenant_id),
    model_type VARCHAR(50),
    configuration JSONB,
    performance_metrics JSONB,
    last_trained TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE predictive_analytics (
    prediction_id VARCHAR(36) PRIMARY KEY,
    entity_type VARCHAR(50),
    entity_id VARCHAR(36),
    prediction_type VARCHAR(50),
    prediction_data JSONB,
    confidence_score DECIMAL(5,2),
    generated_at TIMESTAMP WITH TIME ZONE
) PARTITION BY RANGE (generated_at);

-- 8. Monitoring and Auditing
CREATE TABLE system_health_metrics (
    metric_id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) REFERENCES tenants(tenant_id),
    metric_type VARCHAR(50),
    metric_value JSONB,
    recorded_at TIMESTAMP WITH TIME ZONE
) PARTITION BY RANGE (recorded_at);

CREATE TABLE audit_logs (
    audit_id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) REFERENCES tenants(tenant_id),
    entity_type VARCHAR(50),
    entity_id VARCHAR(36),
    action_type VARCHAR(50),
    action_data JSONB,
    performed_by VARCHAR(36),
    performed_at TIMESTAMP WITH TIME ZONE
) PARTITION BY RANGE (performed_at);

-- 9. Security Enhancements
CREATE TABLE security_policies (
    policy_id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) REFERENCES tenants(tenant_id),
    policy_type VARCHAR(50),
    policy_rules JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create necessary indexes
CREATE INDEX idx_tenant_domain ON tenants(domain);
CREATE INDEX idx_user_tenant ON users(tenant_id);
CREATE INDEX idx_course_tenant ON courses(tenant_id);
CREATE INDEX idx_content_module ON content(module_id);
CREATE INDEX idx_audit_tenant_date ON audit_logs(tenant_id, performed_at);
CREATE INDEX idx_cache_entity ON cache_metadata(entity_type, entity_id);
CREATE INDEX idx_analytics_tenant_metric ON analytics_aggregates(tenant_id, metric_type);

-- Row Level Security
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON tenants
    USING (tenant_id = current_setting('app.current_tenant_id')::VARCHAR);

-- Enhanced MongoDB Schemas

// Enhanced Content Schema
{
  content_id: String,
  version_id: String,
  module_id: String,
  content_type: String,
  rich_content: {
    blocks: Array,
    entityMap: Object,
    version: String
  },
  media: {
    files: Array,
    thumbnails: Array,
    transcripts: Array
  },
  metadata: {
    tags: Array,
    categories: Array,
    accessibility: Object,
    languages: Array
  },
  versioning: {
    version_number: Number,
    changes: Array,
    previous_version: String,
    created_by: String,
    created_at: Date
  },
  analytics: {
    views: Number,
    completion_rate: Number,
    average_time_spent: Number,
    engagement_metrics: Object
  },
  caching: {
    last_cached: Date,
    cache_version: Number,
    invalidation_rules: Object
  }
}

// Enhanced Analytics Schema
{
  analytics_id: String,
  tenant_id: String,
  entity_type: String,
  entity_id: String,
  timeframe: {
    start: Date,
    end: Date,
    granularity: String
  },
  metrics: {
    raw_data: Object,
    aggregations: Object,
    trends: Object,
    predictions: Object
  },
  segments: {
    user_groups: Array,
    demographics: Object,
    behaviors: Object
  },
  ai_insights: {
    recommendations: Array,
    anomalies: Array,
    patterns: Object
  },
  metadata: {
    generated_at: Date,
    version: String,
    data_quality: Object
  }
}

// Enhanced AI Interaction Schema
{
  interaction_id: String,
  user_id: String,
  session_id: String,
  context: {
    course_id: String,
    module_id: String,
    learning_path_id: String
  },
  conversation: {
    messages: Array,
    intent_analysis: Object,
    sentiment_scores: Object
  },
  learning_data: {
    knowledge_gaps: Array,
    mastery_levels: Object,
    recommended_paths: Array
  },
  model_data: {
    model_version: String,
    confidence_scores: Object,
    performance_metrics: Object
  },
  created_at: Date,
  updated_at: Date
}

// System Monitoring Schema
{
  monitoring_id: String,
  tenant_id: String,
  timestamp: Date,
  metrics: {
    system: {
      cpu_usage: Number,
      memory_usage: Number,
      disk_usage: Number,
      network_stats: Object
    },
    application: {
      response_times: Object,
      error_rates: Object,
      active_users: Number
    },
    database: {
      query_performance: Object,
      connection_pools: Object,
      replication_lag: Number
    }
  },
  alerts: {
    severity: String,
    message: String,
    triggered_rules: Array
  },
  metadata: {
    environment: String,
    version: String,
    region: String
  }
}

// Create MongoDB Indexes
db.content.createIndex({ "content_id": 1, "version_id": 1 });
db.content.createIndex({ "module_id": 1 });
db.content.createIndex({ "metadata.tags": 1 });
db.content.createIndex({ "analytics.views": -1 });

db.analytics.createIndex({ "tenant_id": 1, "entity_id": 1 });
db.analytics.createIndex({ "timeframe.start": 1, "timeframe.end": 1 });

db.ai_interactions.createIndex({ "user_id": 1, "session_id": 1 });
db.ai_interactions.createIndex({ "created_at": -1 });

db.system_monitoring.createIndex({ "tenant_id": 1, "timestamp": -1 });
db.system_monitoring.createIndex({ "metrics.application.error_rates": 1 });
