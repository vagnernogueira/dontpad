.PHONY: build run stop dev-frontend dev-backend install

build:
	podman-compose build

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
