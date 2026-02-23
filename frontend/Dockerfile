FROM docker.io/node:20-alpine AS builder

WORKDIR /usr/src/app

ARG VITE_HOME_DOCS_PASSWORD
ARG VITE_HOME_DOCS_SHORTCUT=Alt+R
ARG VITE_BACKEND_HTTP_URL
ARG VITE_BACKEND_WS_URL
ENV VITE_HOME_DOCS_PASSWORD=$VITE_HOME_DOCS_PASSWORD
ENV VITE_HOME_DOCS_SHORTCUT=$VITE_HOME_DOCS_SHORTCUT
ENV VITE_BACKEND_HTTP_URL=$VITE_BACKEND_HTTP_URL
ENV VITE_BACKEND_WS_URL=$VITE_BACKEND_WS_URL

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN test -n "$VITE_HOME_DOCS_PASSWORD" || (echo "Missing VITE_HOME_DOCS_PASSWORD for frontend build" && exit 1)
RUN npm run build

FROM docker.io/nginx:alpine

COPY --from=builder /usr/src/app/dist /usr/share/nginx/html

# Replace default config for SPA routing
RUN rm /etc/nginx/conf.d/default.conf
RUN echo "server { listen 80; location / { root /usr/share/nginx/html; try_files \$uri \$uri/ /index.html; } location /api { proxy_pass http://backend:1234; proxy_http_version 1.1; proxy_set_header Upgrade \$http_upgrade; proxy_set_header Connection \"Upgrade\"; } }" > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
