FROM docker.io/node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

FROM docker.io/nginx:alpine

COPY --from=builder /usr/src/app/dist /usr/share/nginx/html

# Replace default config for SPA routing
RUN rm /etc/nginx/conf.d/default.conf
RUN echo "server { listen 80; location / { root /usr/share/nginx/html; try_files \$uri \$uri/ /index.html; } location /api { proxy_pass http://backend:1234; proxy_http_version 1.1; proxy_set_header Upgrade \$http_upgrade; proxy_set_header Connection \"Upgrade\"; } }" > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
