.PHONY: build run stop dev-frontend dev-backend install test

test:
	cd backend && npm run test
	cd frontend && npm run test

build: test
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
