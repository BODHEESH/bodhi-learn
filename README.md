
# 🎓 Bodhi Learning Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
[![Docker](https://img.shields.io/badge/Docker-Supported-blue.svg)](https://www.docker.com/)
[![Documentation](https://img.shields.io/badge/docs-up%20to%20date-green.svg)](./docs)
![Coverage Status](https://coveralls.io/repos/github/bodheeshvc/bodhi-learning-platform/badge.svg?branch=main)
![Code Style](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)

A comprehensive multi-tenant learning platform that combines educational content delivery with social learning features. Bodhi aims to create an engaging learning environment where education meets community.

## 📊 Statistics
![GitHub Stars](https://img.shields.io/github/stars/bodheeshvc/bodhi-learning-platform)
![GitHub Forks](https://img.shields.io/github/forks/bodheeshvc/bodhi-learning-platform)
![GitHub Issues](https://img.shields.io/github/issues/bodheeshvc/bodhi-learning-platform)
![GitHub Pull Requests](https://img.shields.io/github/issues-pr/bodheeshvc/bodhi-learning-platform)

## 🔗 Quick Links
[Documentation](https://docs.bodhilearn.com) • 
[API Reference](https://api.bodhilearn.com) • 
[Community](https://discord.gg/bodhi-learning) • 
[Support](mailto:support@bodhi-learn.com)

## 🎮 Demo

[Live Demo](https://demo.bodhilearn.com) | [Video Tutorial](https://youtube.com/bodhilearning)

<p align="center">
  <img src="/screenshots/demo.gif" alt="Bodhi Platform Demo" width="80%"/>
</p>

## ✨ Features Showcase

| Feature | Screenshot | Description |
|---------|------------|-------------|
| Course Dashboard | ![Course Dashboard](/screenshots/dashboard.png) | Interactive learning dashboard with progress tracking |
| Social Learning | ![Social Features](/screenshots/social.png) | Community features and peer learning tools |
| Analytics | ![Analytics](/screenshots/analytics.png) | Comprehensive learning analytics and insights |
| Multi-tenant System | ![Multi-tenant](/screenshots/tenant.png) | Customizable tenant spaces with branding |

## 🌟 Key Features

### 🎯 Core Learning Features
- **Course Management**
  - Structured course creation and delivery
  - Interactive content modules
  - Assessment and quiz systems
  - Real-time progress tracking

- **Adaptive Learning**
  - AI-powered personalized learning paths
  - Intelligent content recommendations
  - Learning pace optimization
  - Customized assessment difficulty

### 🤝 Social Learning
- **Community Features**
  - Discussion forums
  - Study groups
  - Peer-to-peer learning
  - Social posts and shorts
  - Interactive stories

- **Engagement Tools**
  - Gamification system
  - Badges and achievements
  - Leaderboards
  - Challenges and events

## 🏗 System Architecture

<p align="center">
  <img src="/diagrams/architecture.png" alt="System Architecture" width="80%"/>
</p>

### Database Schema
```mermaid
erDiagram
    Tenant ||--|{ Course : manages
    Tenant ||--|{ User : contains
    Course ||--|{ Module : contains
    User ||--o{ Course : enrolls
    User ||--o{ Social_Group : joins
    User ||--o{ Badge : earns
```
[View complete database schema](./docs/schema.md)

## 💻 Tech Stack

<p align="center">
  <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/nodejs/nodejs-original.svg" alt="nodejs" width="40" height="40"/>
  <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/react/react-original.svg" alt="react" width="40" height="40"/>
  <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/postgresql/postgresql-original.svg" alt="postgresql" width="40" height="40"/>
  <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/redis/redis-original.svg" alt="redis" width="40" height="40"/>
  <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/docker/docker-original.svg" alt="docker" width="40" height="40"/>
  <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/amazonwebservices/amazonwebservices-original.svg" alt="aws" width="40" height="40"/>
</p>

- **Backend**: Node.js, Express
- **Frontend**: React, Next.js
- **Database**: PostgreSQL
- **Cache**: Redis
- **Search**: Elasticsearch
- **File Storage**: AWS S3
- **CDN**: Cloudfront
- **Analytics**: Clickhouse

## 💪 Supported Environments

| Environment | Support Status |
|-------------|---------------|
| Node.js 16+ | ✅ Full |
| Docker | ✅ Full |
| Kubernetes | ✅ Full |
| AWS | ✅ Full |
| GCP | 🚧 In Progress |
| Azure | 🚧 In Progress |

## 🛣 Roadmap

- [x] Multi-tenant system
- [x] Course management
- [x] Social features
- [x] AI-powered learning paths
- [ ] Mobile app (Q1 2025)
- [ ] AR/VR learning experiences (Q2 2025)
- [ ] Blockchain certificates (Q3 2025)
- [ ] Live classroom features (Q4 2025)

## 🚀 Getting Started

### Prerequisites
- Node.js >= 16
- PostgreSQL >= 13
- Redis >= 6
- Docker (optional)

### Installation

1. Clone the repository
```bash
git clone https://github.com/bodheeshvc/bodhi-learning-platform.git
cd bodhi-learning-platform
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run database migrations
```bash
npm run migrate
```

5. Start the development server
```bash
npm run dev
```

### Docker Deployment

```bash
docker-compose up -d
```

## 📚 Documentation

- [API Documentation](./docs/api.md)
- [Architecture Overview](./docs/architecture.md)
- [Deployment Guide](./docs/deployment.md)
- [Contributing Guidelines](./CONTRIBUTING.md)

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Run with coverage:
```bash
npm run test:coverage
```

## 📦 API Endpoints

### Authentication
```
POST /api/v1/auth/login
POST /api/v1/auth/register
POST /api/v1/auth/refresh-token
```

### Courses
```
GET /api/v1/courses
POST /api/v1/courses
GET /api/v1/courses/:id
PUT /api/v1/courses/:id
DELETE /api/v1/courses/:id
```

### Social Features
```
GET /api/v1/posts
POST /api/v1/posts
GET /api/v1/groups
POST /api/v1/groups
```

[View complete API documentation](./docs/api.md)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

<p align="center">
  <img src="/assets/contributors.png" alt="Contributors" width="80%"/>
</p>

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Thanks to all contributors who have helped shape Bodhi
- Special thanks to our early adopters and testers
- Built with support from the open-source community

## 📞 Contact & Support

- Website: [bodhilearn.com](https://bodhilearn.com), [bodhilearning.in](https://bodhilearning.in/)
- Email: support@bodhi-learn.com, bodheeshvc.developer@gmail.com
- LinkedIn: [@BodhiLearning](https://www.linkedin.com/company/bodhi-learning-app/), [@Bodheesh vc](https://www.linkedin.com/in/bodheeshvc/)
- Twitter: [@BodhiLearning](https://twitter.com/BodhiLearning)
- Discord: [Join our community](https://discord.gg/bodhi-learning)

<p align="center">
  <img src="/assets/footer-banner.png" alt="Built with love" width="100%"/>
</p>

---

<p align="center">Built with ❤️ by the Bodhi Team</p>
