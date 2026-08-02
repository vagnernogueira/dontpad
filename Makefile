IMAGE_REGISTRY ?= ghcr.io/vagnernogueira
TAG ?= latest

.PHONY: build push run stop dev-frontend dev-backend install test

test:
	cd backend && npm run test
	cd frontend && npm run test

build: test
	podman build -f ./backend/Dockerfile -t $(IMAGE_REGISTRY)/dontpad-backend:$(TAG) ./backend
	set -a; [ ! -f ./.env ] || . ./.env; set +a; \
	podman build --no-cache -f ./frontend/Dockerfile -t $(IMAGE_REGISTRY)/dontpad-frontend:$(TAG) --build-arg VITE_BACKEND_HTTP_URL=$${VITE_BACKEND_HTTP_URL:-} --build-arg VITE_BACKEND_WS_URL=$${VITE_BACKEND_WS_URL:-} ./frontend

push: build
	podman push $(IMAGE_REGISTRY)/dontpad-backend:$(TAG)
	podman push $(IMAGE_REGISTRY)/dontpad-frontend:$(TAG)

run:
	podman-compose up -d

stop:
	podman-compose down

install:
	cd backend && npm install
	cd frontend && npm install

dev-frontend:
	cd frontend && npm run dev

dev-backend:
	cd backend && npm run dev
