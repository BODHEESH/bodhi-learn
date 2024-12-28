#!/bin/bash

# Create root project directory
mkdir - p bodhi - learn && cd bodhi - learn

# Create base project files
touch.gitignore README.md package.json
touch docker - compose.yml Dockerfile

# API Gateway structure
mkdir - p api - gateway / src / { config, controllers, middleware, routes, utils, validators }
touch api - gateway /.env api - gateway /.env.example api - gateway / package.json api - gateway / tsconfig.json
touch api - gateway / src / app.js api - gateway / src / server.js

# API Gateway config and middleware
touch api - gateway / src / config / { gateway.config.js, database.config.js, redis.config.js, routes.config.js, security.config.js }
touch api - gateway / src / middleware / { auth.middleware.js, cache.middleware.js, error.middleware.js, rate- limit.middleware.js, logging.middleware.js}

# API Gateway routes based on ER entities
touch api - gateway / src / routes / { auth.routes.js, user.routes.js, course.routes.js, social.routes.js, assessment.routes.js, gamification.routes.js, ai.routes.js, mentorship.routes.js, notification.routes.js, analytics.routes.js }

# Create shared resources
mkdir - p shared / { constants, utils, types, interfaces, middleware, models }
touch shared / constants / { error- codes.js, response - messages.js, service - endpoints.js}
touch shared / utils / { date- formatter.js, string - helper.js, validation - helper.js}
touch shared / types / { common.types.js, request.types.js, response.types.js }
touch shared / interfaces / { service.interface.js, repository.interface.js }
touch shared / models / { base.model.js, common.model.js }

# User Service
mkdir - p services / user - service / src / { config, controllers, models, routes, services, middleware, utils }
touch services / user - service /.env services / user - service / package.json
touch services / user - service / src / app.js services / user - service / src / server.js
touch services / user - service / src / models / { user.model.js, profile- stats.model.js, preferences.model.js}
touch services / user - service / src / controllers / { user.controller.js, profile.controller.js, auth.controller.js }
touch services / user - service / src / routes / { user.routes.js, profile.routes.js, auth.routes.js }
touch services / user - service / src / services / { user.service.js, profile.service.js, auth.service.js }

# Course Service
mkdir - p services / course - service / src / { config, controllers, models, routes, services, middleware, utils }
touch services / course - service /.env services / course - service / package.json
touch services / course - service / src / models / { course.model.js, module.model.js, content.model.js, interactive- video.model.js, practice - material.model.js}
touch services / course - service / src / controllers / { course.controller.js, module.controller.js, content.controller.js }
touch services / course - service / src / routes / { course.routes.js, module.routes.js, content.routes.js }
touch services / course - service / src / services / { course.service.js, content.service.js, media.service.js }

# Assessment Service
mkdir - p services / assessment - service / src / { config, controllers, models, routes, services, middleware, utils }
touch services / assessment - service /.env services / assessment - service / package.json
touch services / assessment - service / src / models / { assessment.model.js, quiz.model.js, certification.model.js }
touch services / assessment - service / src / controllers / { assessment.controller.js, quiz.controller.js, certification.controller.js }
touch services / assessment - service / src / routes / { assessment.routes.js, quiz.routes.js, certification.routes.js }
touch services / assessment - service / src / services / { assessment.service.js, grading.service.js, certification.service.js }

# Social Service
mkdir - p services / social - service / src / { config, controllers, models, routes, services, middleware, utils }
touch services / social - service /.env services / social - service / package.json
touch services / social - service / src / models / { post.model.js, comment.model.js, social- group.model.js, social - relationship.model.js, story.model.js, short.model.js, event.model.js}
touch services / social - service / src / controllers / { post.controller.js, group.controller.js, relationship.controller.js, story.controller.js, short.controller.js, event.controller.js }
touch services / social - service / src / routes / { post.routes.js, group.routes.js, relationship.routes.js, story.routes.js, short.routes.js, event.routes.js }
touch services / social - service / src / services / { post.service.js, feed.service.js, relationship.service.js, media.service.js }

# Gamification Service
mkdir - p services / gamification - service / src / { config, controllers, models, routes, services, middleware, utils }
touch services / gamification - service /.env services / gamification - service / package.json
touch services / gamification - service / src / models / { badge.model.js, gamification.model.js, challenge.model.js, leaderboard.model.js }
touch services / gamification - service / src / controllers / { badge.controller.js, challenge.controller.js, leaderboard.controller.js }
touch services / gamification - service / src / routes / { badge.routes.js, challenge.routes.js, leaderboard.routes.js }
touch services / gamification - service / src / services / { badge.service.js, points.service.js, leaderboard.service.js }

# AI Service
mkdir - p services / ai - service / src / { config, controllers, models, routes, services, middleware, utils }
touch services / ai - service /.env services / ai - service / package.json
touch services / ai - service / src / models / { chatbot.model.js, recommendation.model.js, learning- path.model.js}
touch services / ai - service / src / controllers / { chatbot.controller.js, recommendation.controller.js, learning- path.controller.js}
touch services / ai - service / src / routes / { chatbot.routes.js, recommendation.routes.js, learning- path.routes.js}
touch services / ai - service / src / services / { chatbot.service.js, recommendation.service.js, learning- path.service.js}

# Analytics Service
mkdir - p services / analytics - service / src / { config, controllers, models, routes, services, middleware, utils }
touch services / analytics - service /.env services / analytics - service / package.json
touch services / analytics - service / src / models / { analytics.model.js, activity- log.model.js, social - analytics.model.js}
touch services / analytics - service / src / controllers / { analytics.controller.js, reporting.controller.js, metrics.controller.js }
touch services / analytics - service / src / routes / { analytics.routes.js, reporting.routes.js, metrics.routes.js }
touch services / analytics - service / src / services / { analytics.service.js, reporting.service.js, metrics.service.js }

# Notification Service
mkdir - p services / notification - service / src / { config, controllers, models, routes, services, middleware, utils }
touch services / notification - service /.env services / notification - service / package.json
touch services / notification - service / src / models / { notification.model.js, template.model.js }
touch services / notification - service / src / controllers / { notification.controller.js, template.controller.js }
touch services / notification - service / src / routes / { notification.routes.js, template.routes.js }
touch services / notification - service / src / services / { notification.service.js, email.service.js, push.service.js }

# Create documentation directory
mkdir - p docs / { api, architecture, deployment }
touch docs / api / swagger.yaml
touch docs / architecture / { overview.md, data- flow.md, er - diagram.md}
touch docs / deployment / { docker.md, kubernetes.md }

# Create testing directories for each service
for service in user - service course - service assessment - service social - service gamification - service ai - service analytics - service notification - service; do
    mkdir - p services / $service / src / tests / { unit, integration, e2e }
    touch services / $service / src / tests / jest.config.js
    touch services / $service / src / tests / setup.js
done

# Create deployment configurations
mkdir - p deployment / { docker, kubernetes, scripts }
touch deployment / docker / docker - compose.yml
touch deployment / kubernetes / { deployment.yaml, service.yaml, ingress.yaml }
touch deployment / scripts / { deploy.sh, backup.sh, monitoring.sh }

echo "Updated folder structure created successfully!"
