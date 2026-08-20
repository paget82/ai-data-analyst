FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Baked in at build time so the compiled JS bundle points at the right
# n8n webhook URL and auth token.
ARG VITE_N8N_WEBHOOK_URL
ARG VITE_N8N_AUTH_TOKEN
ENV VITE_N8N_WEBHOOK_URL=${VITE_N8N_WEBHOOK_URL}
ENV VITE_N8N_AUTH_TOKEN=${VITE_N8N_AUTH_TOKEN}

RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
