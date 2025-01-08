erDiagram
    %% Identity Management Service
    Tenant ||--o{ Organization : has
    Tenant {
        string id PK
        string name
        string domain
        string status
        json settings
        json branding
        json configuration
        datetime created_at
        datetime updated_at
        string created_by FK
        string updated_by FK
    }
    
    Organization ||--o{ Department : contains
    Organization ||--o{ Branch : has
    Organization {
        string id PK
        string tenant_id FK
        string name
        string type
        string status
        string address
        string contact_email
        string contact_phone
        json metadata
        json settings
        json configuration
        datetime created_at
        datetime updated_at
        string created_by FK
        string updated_by FK
    }

    Branch ||--o{ Department : houses
    Branch {
        string id PK
        string org_id FK
        string name
        string code
        string address
        string contact_info
        string status
        json metadata
        datetime created_at
        datetime updated_at
    }

    Department ||--o{ User : has
    Department {
        string id PK
        string org_id FK
        string branch_id FK
        string name
        string code
        string description
        string parent_id FK
        string head_user_id FK
        string status
        json metadata
        datetime created_at
        datetime updated_at
    }

    User ||--o{ UserRole : has
    User ||--o{ UserProfile : has_profile
    User ||--o{ UserSession : has_sessions
    User {
        string id PK
        string org_id FK
        string dept_id FK
        string email
        string password_hash
        string first_name
        string last_name
        string username
        string status
        string phone
        boolean email_verified
        boolean phone_verified
        json preferences
        json settings
        datetime last_login
        datetime password_changed_at
        datetime created_at
        datetime updated_at
        string created_by FK
        string updated_by FK
    }

    UserProfile {
        string id PK
        string user_id FK
        string avatar_url
        string bio
        json social_links
        json additional_info
        json preferences
        datetime created_at
        datetime updated_at
    }

    UserSession {
        string id PK
        string user_id FK
        string token
        string device_info
        string ip_address
        datetime expires_at
        datetime last_active_at
        datetime created_at
    }

    Role ||--o{ UserRole : assigned_to
    Role ||--o{ RolePermission : has
    Role {
        string id PK
        string org_id FK
        string name
        string code
        string description
        string scope
        json metadata
        datetime created_at
        datetime updated_at
    }

    Permission ||--o{ RolePermission : granted_to
    Permission {
        string id PK
        string name
        string code
        string description
        string resource
        string action
        string scope
        datetime created_at
        datetime updated_at
    }

    RolePermission {
        string id PK
        string role_id FK
        string permission_id FK
        json conditions
        datetime created_at
        datetime updated_at
    }

    UserRole {
        string id PK
        string user_id FK
        string role_id FK
        string org_id FK
        datetime assigned_at
        datetime expires_at
        string assigned_by FK
        datetime created_at
        datetime updated_at
    }

    %% Learning Management Service
    Course ||--o{ Module : contains
    Course ||--o{ Enrollment : has_students
    Course ||--o{ CourseInstructor : has_instructors
    Course {
        string id PK
        string org_id FK
        string dept_id FK
        string code
        string title
        string description
        string category
        string difficulty_level
        string status
        integer duration_hours
        json prerequisites
        json learning_objectives
        json metadata
        json settings
        datetime published_at
        datetime archived_at
        datetime created_at
        datetime updated_at
        string created_by FK
        string updated_by FK
    }

    CourseInstructor {
        string id PK
        string course_id FK
        string user_id FK
        string role
        datetime assigned_at
        datetime removed_at
        datetime created_at
        datetime updated_at
    }

    Module ||--o{ Unit : contains
    Module ||--o{ ModulePrerequisite : has_prerequisites
    Module {
        string id PK
        string course_id FK
        string title
        string description
        integer sequence_no
        integer duration_mins
        string status
        json learning_objectives
        json metadata
        datetime published_at
        datetime created_at
        datetime updated_at
        string created_by FK
    }

    ModulePrerequisite {
        string id PK
        string module_id FK
        string prerequisite_module_id FK
        string requirement_type
        datetime created_at
        datetime updated_at
    }

    Unit ||--o{ Content : has
    Unit ||--o{ Assessment : has_assessments
    Unit {
        string id PK
        string module_id FK
        string title
        string description
        string type
        integer sequence_no
        integer duration_mins
        json settings
        string status
        datetime published_at
        datetime created_at
        datetime updated_at
        string created_by FK
    }

    Content ||--o{ Resource : uses
    Content ||--o{ ContentProgress : tracks_progress
    Content {
        string id PK
        string unit_id FK
        string type
        string title
        json content_data
        string status
        integer estimated_duration
        json metadata
        datetime published_at
        datetime created_at
        datetime updated_at
        string created_by FK
    }

    Resource {
        string id PK
        string content_id FK
        string type
        string title
        string url
        string mime_type
        integer size_bytes
        json metadata
        datetime created_at
        datetime updated_at
    }

    Assessment ||--o{ Question : contains
    Assessment ||--o{ AssessmentAttempt : tracks_attempts
    Assessment {
        string id PK
        string unit_id FK
        string title
        string description
        string type
        integer passing_score
        integer max_score
        integer duration_mins
        integer max_attempts
        json settings
        string status
        datetime published_at
        datetime created_at
        datetime updated_at
        string created_by FK
    }

    Question ||--o{ Option : has_options
    Question ||--o{ QuestionResponse : has_responses
    Question {
        string id PK
        string assessment_id FK
        string type
        string question_text
        json metadata
        integer points
        json correct_answer
        json explanation
        datetime created_at
        datetime updated_at
    }

    Option {
        string id PK
        string question_id FK
        string text
        boolean is_correct
        integer sequence_no
        json metadata
        datetime created_at
        datetime updated_at
    }

    AssessmentAttempt ||--o{ QuestionResponse : contains
    AssessmentAttempt {
        string id PK
        string assessment_id FK
        string user_id FK
        string enrollment_id FK
        integer attempt_number
        integer score
        string status
        datetime start_time
        datetime end_time
        datetime submitted_at
        datetime created_at
        datetime updated_at
    }

    QuestionResponse {
        string id PK
        string attempt_id FK
        string question_id FK
        json response_data
        boolean is_correct
        integer points_earned
        json feedback
        datetime created_at
        datetime updated_at
    }

    Enrollment ||--o{ ContentProgress : tracks
    Enrollment ||--o{ AssessmentAttempt : includes
    Enrollment {
        string id PK
        string user_id FK
        string course_id FK
        string status
        float progress
        datetime enrolled_at
        datetime start_date
        datetime completion_date
        json completion_criteria
        datetime created_at
        datetime updated_at
    }

    ContentProgress {
        string id PK
        string enrollment_id FK
        string content_id FK
        string status
        float progress
        integer time_spent_mins
        datetime last_accessed
        datetime completed_at
        datetime created_at
        datetime updated_at
    }

    %% Discussion System
    Discussion ||--o{ Comment : has
    Discussion {
        string id PK
        string course_id FK
        string unit_id FK
        string user_id FK
        string title
        string content
        string type
        string status
        integer view_count
        datetime created_at
        datetime updated_at
    }

    Comment ||--o{ CommentReaction : receives
    Comment {
        string id PK
        string discussion_id FK
        string user_id FK
        string content
        string parent_id FK
        integer likes_count
        datetime created_at
        datetime updated_at
    }

    CommentReaction {
        string id PK
        string comment_id FK
        string user_id FK
        string reaction_type
        datetime created_at
    }

    %% Certificate System
    Certificate ||--o{ CertificateTemplate : uses
    Certificate {
        string id PK
        string user_id FK
        string course_id FK
        string template_id FK
        string certificate_number
        string certificate_url
        json metadata
        datetime issue_date
        datetime expiry_date
        datetime created_at
        datetime updated_at
    }

    CertificateTemplate {
        string id PK
        string org_id FK
        string name
        string description
        json template_data
        string status
        datetime created_at
        datetime updated_at
    }

    %% Analytics System
    AnalyticsEvent {
        string id PK
        string user_id FK
        string event_type
        string entity_type
        string entity_id
        json event_data
        string session_id
        datetime created_at
    }

    UserActivity {
        string id PK
        string user_id FK
        string activity_type
        string entity_type
        string entity_id
        json activity_data
        datetime created_at
    }

    %% Notification System
    Notification ||--o{ NotificationRecipient : sent_to
    Notification {
        string id PK
        string type
        string title
        string content
        json metadata
        string status
        datetime scheduled_at
        datetime sent_at
        datetime created_at
        datetime updated_at
    }

    NotificationRecipient {
        string id PK
        string notification_id FK
        string user_id FK
        boolean is_read
        datetime read_at
        datetime created_at
    }

    %% Settings and Preferences
    SystemSettings {
        string id PK
        string category
        string key
        json value
        string description
        datetime created_at
        datetime updated_at
    }

    UserPreference {
        string id PK
        string user_id FK
        string category
        string key
        json value
        datetime created_at
        datetime updated_at
    }

    %% Identity Management Service - Enhanced Section
    Tenant ||--o{ Organization : has
    Tenant ||--o{ TenantConfig : has
    Tenant ||--o{ TenantDomain : has
    Tenant ||--o{ TenantSubscription : subscribes_to
    Tenant ||--o{ TenantBilling : has_billing
    Tenant ||--o{ TenantTheme : has_theme
    Tenant ||--o{ TenantFeature : has_features
    Tenant ||--o{ TenantIntegration : has_integrations
    Tenant {
        string id PK
        string name
        string primary_domain
        string status
        string subscription_tier
        string industry_type
        json settings
        json branding
        json configuration
        boolean is_active
        boolean is_verified
        integer max_users
        integer max_storage_gb
        datetime trial_starts_at
        datetime trial_ends_at
        datetime suspended_at
        datetime verified_at
        datetime created_at
        datetime updated_at
        string created_by FK
        string updated_by FK
    }

    TenantSubscription {
        string id PK
        string tenant_id FK
        string plan_id FK
        string status
        decimal amount
        string currency
        string billing_cycle
        json features
        json usage_limits
        datetime starts_at
        datetime ends_at
        datetime canceled_at
        datetime created_at
        datetime updated_at
    }

    TenantBilling {
        string id PK
        string tenant_id FK
        string subscription_id FK
        string billing_name
        string billing_email
        string billing_address
        string tax_id
        string currency
        json payment_method
        boolean auto_renew
        datetime last_billed_at
        datetime next_billing_at
        datetime created_at
        datetime updated_at
    }

    TenantTheme {
        string id PK
        string tenant_id FK
        string name
        json colors
        json typography
        json layout
        json components
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    TenantFeature {
        string id PK
        string tenant_id FK
        string feature_key
        boolean is_enabled
        json configuration
        json usage_limits
        json usage_stats
        datetime enabled_at
        datetime expires_at
        datetime created_at
        datetime updated_at
    }

    TenantIntegration {
        string id PK
        string tenant_id FK
        string integration_type
        string provider
        json credentials
        json configuration
        string status
        datetime last_synced_at
        datetime created_at
        datetime updated_at
    }

    Organization ||--o{ Department : contains
    Organization ||--o{ Branch : has
    Organization ||--o{ OrgConfig : has
    Organization {
        string id PK
        string tenant_id FK
        string name
        string code
        string type
        string status
        string address
        string contact_email
        string contact_phone
        string tax_id
        string registration_number
        json metadata
        json settings
        json configuration
        string parent_org_id FK
        boolean is_active
        datetime activated_at
        datetime suspended_at
        datetime created_at
        datetime updated_at
        string created_by FK
        string updated_by FK
    }

    OrgConfig {
        string id PK
        string org_id FK
        string config_key
        json config_value
        string category
        boolean is_encrypted
        datetime created_at
        datetime updated_at
    }

    Branch ||--o{ Department : houses
    Branch ||--o{ BranchContact : has
    Branch {
        string id PK
        string org_id FK
        string name
        string code
        string address
        string city
        string state
        string country
        string postal_code
        string contact_info
        string status
        json metadata
        json operating_hours
        string head_user_id FK
        boolean is_main_branch
        datetime created_at
        datetime updated_at
    }

    BranchContact {
        string id PK
        string branch_id FK
        string type
        string name
        string designation
        string email
        string phone
        boolean is_primary
        datetime created_at
        datetime updated_at
    }

    Department ||--o{ User : has
    Department ||--o{ DepartmentRole : has
    Department {
        string id PK
        string org_id FK
        string branch_id FK
        string name
        string code
        string description
        string parent_id FK
        string head_user_id FK
        string status
        json metadata
        json settings
        integer employee_count
        datetime created_at
        datetime updated_at
    }

    DepartmentRole {
        string id PK
        string dept_id FK
        string role_id FK
        json permissions
        datetime created_at
        datetime updated_at
    }

    User ||--o{ UserRole : has
    User ||--o{ UserProfile : has_profile
    User ||--o{ UserSession : has_sessions
    User ||--o{ UserDevice : has_devices
    User ||--o{ UserLoginHistory : has_login_history
    User ||--o{ UserEducation : has_education
    User ||--o{ UserWorkHistory : has_work_history
    User ||--o{ UserSkill : has_skills
    User ||--o{ UserCertification : has_certifications
    User ||--o{ UserNotificationPreference : has_notification_preferences
    User ||--o{ UserSecurityQuestion : has_security_questions
    User {
        string id PK
        string org_id FK
        string dept_id FK
        string employee_id
        string email
        string username
        string password_hash
        string password_salt
        string first_name
        string middle_name
        string last_name
        string phone
        string status
        string user_type
        string auth_provider
        json preferences
        json settings
        boolean is_active
        boolean is_locked
        boolean is_system_user
        boolean email_verified
        boolean phone_verified
        integer failed_login_attempts
        datetime password_changed_at
        datetime last_login
        datetime last_active_at
        datetime email_verified_at
        datetime phone_verified_at
        datetime locked_at
        datetime deactivated_at
        datetime created_at
        datetime updated_at
        string created_by FK
        string updated_by FK
    }

    UserEducation {
        string id PK
        string user_id FK
        string institution
        string degree
        string field_of_study
        string grade
        date start_date
        date end_date
        boolean is_current
        json additional_info
        datetime created_at
        datetime updated_at
    }

    UserWorkHistory {
        string id PK
        string user_id FK
        string company
        string position
        string location
        text description
        date start_date
        date end_date
        boolean is_current
        json additional_info
        datetime created_at
        datetime updated_at
    }

    UserSkill {
        string id PK
        string user_id FK
        string skill_name
        string proficiency_level
        integer years_of_experience
        json endorsements
        datetime created_at
        datetime updated_at
    }

    UserCertification {
        string id PK
        string user_id FK
        string name
        string issuing_organization
        string credential_id
        string credential_url
        date issue_date
        date expiry_date
        boolean is_verified
        datetime verified_at
        datetime created_at
        datetime updated_at
    }

    UserNotificationPreference {
        string id PK
        string user_id FK
        string notification_type
        string channel
        boolean is_enabled
        json delivery_schedule
        datetime created_at
        datetime updated_at
    }

    UserSecurityQuestion {
        string id PK
        string user_id FK
        string question
        string answer_hash
        integer sequence
        datetime answered_at
        datetime created_at
        datetime updated_at
    }

    UserProfile ||--o{ UserLanguage : speaks
    UserProfile ||--o{ UserDocument : has
    UserProfile {
        string id PK
        string user_id FK
        string avatar_url
        string cover_photo_url
        string bio
        date date_of_birth
        string gender
        string marital_status
        string nationality
        string blood_group
        string address_line1
        string address_line2
        string city
        string state
        string country
        string postal_code
        json social_links
        json additional_info
        json preferences
        json emergency_contacts
        json custom_fields
        datetime created_at
        datetime updated_at
    }

    UserLanguage {
        string id PK
        string user_profile_id FK
        string language
        string proficiency_level
        boolean is_primary
        datetime created_at
        datetime updated_at
    }

    UserDocument {
        string id PK
        string user_profile_id FK
        string document_type
        string title
        string file_url
        string file_type
        integer file_size
        boolean is_verified
        datetime expires_at
        datetime verified_at
        datetime created_at
        datetime updated_at
    }

    UserSession ||--o{ UserSessionActivity : tracks
    UserSession {
        string id PK
        string user_id FK
        string token
        string refresh_token
        string device_id FK
        string device_info
        string ip_address
        string user_agent
        json permissions
        json metadata
        datetime expires_at
        datetime refresh_token_expires_at
        datetime last_active_at
        datetime revoked_at
        string revoked_reason
        string revoked_by FK
        datetime created_at
    }

    UserSessionActivity {
        string id PK
        string session_id FK
        string activity_type
        string ip_address
        json activity_data
        datetime created_at
    }

    Role ||--o{ UserRole : assigned_to
    Role ||--o{ RolePermission : has
    Role ||--o{ RoleHierarchy : has_hierarchy
    Role {
        string id PK
        string org_id FK
        string name
        string code
        string description
        string scope
        json metadata
        boolean is_system_role
        boolean is_default
        integer priority_level
        datetime created_at
        datetime updated_at
    }

    RoleHierarchy {
        string id PK
        string parent_role_id FK
        string child_role_id FK
        datetime created_at
        datetime updated_at
    }

    Permission ||--o{ RolePermission : granted_to
    Permission ||--o{ PermissionGroup : belongs_to
    Permission {
        string id PK
        string name
        string code
        string description
        string resource
        string action
        string scope
        string category
        boolean is_system_permission
        datetime created_at
        datetime updated_at
    }

    PermissionGroup {
        string id PK
        string name
        string description
        string category
        datetime created_at
        datetime updated_at
    }

    RolePermission {
        string id PK
        string role_id FK
        string permission_id FK
        json conditions
        json constraints
        boolean is_active
        datetime effective_from
        datetime effective_until
        datetime created_at
        datetime updated_at
    }

    UserRole {
        string id PK
        string user_id FK
        string role_id FK
        string org_id FK
        string dept_id FK
        json custom_permissions
        datetime assigned_at
        datetime expires_at
        string assigned_by FK
        boolean is_primary
        datetime created_at
        datetime updated_at
    }
