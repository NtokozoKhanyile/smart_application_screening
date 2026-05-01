# Build stage
FROM node:20-alpine as build-stage

# Install dependencies for native modules
RUN apk add --no-cache libc6-compat

WORKDIR /app

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Only copy package.json to avoid Windows vs Linux lockfile conflicts
COPY package.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

# Production stage
FROM nginx:stable-alpine as production-stage

COPY --from=build-stage /app/dist /usr/share/nginx/html
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
