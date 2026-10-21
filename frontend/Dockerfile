FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Baked in at build time so the compiled JS bundle points at the right
# backend URL and auth token.
ARG VITE_API_URL
ARG VITE_API_AUTH_TOKEN
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_API_AUTH_TOKEN=${VITE_API_AUTH_TOKEN}

RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
