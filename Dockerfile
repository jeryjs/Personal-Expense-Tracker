# syntax=docker/dockerfile:1

# Comments are provided throughout this file to help you get started.
# If you need more help, visit the Dockerfile reference guide at
# https://docs.docker.com/go/dockerfile-reference/

# Want to help us make this template better? Share your feedback here: https://forms.gle/ybq9Krt8jtBL3iCk7

ARG NODE_VERSION=24.7.0
ARG PNPM_VERSION=10.15.0

FROM node:${NODE_VERSION}-alpine

# Use production node environment by default.
ENV NODE_ENV production

# setup app dir with common and backend code
WORKDIR /usr/src/app
COPY backend ./backend
COPY common ./common
WORKDIR /usr/src/app/backend

# Install pnpm.
RUN --mount=type=cache,target=/root/.npm \
    npm install -g pnpm@${PNPM_VERSION}

# Copy backend files and lockfile
COPY backend/package.json backend/pnpm-lock.yaml ./

# Install backend dependencies
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# Copy backend source code
COPY backend ./

# Expose backend port
EXPOSE 3000

# Use node user for security
USER node

# Run the application.
CMD pnpm dev
