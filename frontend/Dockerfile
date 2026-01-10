# Stage 1: Build
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 3: Production
FROM nginx:stable-alpine
# Copy the build output from Vite
COPY --from=build /app/dist /usr/share/nginx/html
# Copy our custom nginx config to handle SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]