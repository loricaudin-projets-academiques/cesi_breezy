dev-back:
	cd breezy-back && docker compose up

dev-front:
	cd breezy-front && npm run dev

lint-back:
	cd breezy-back && npm run lint

lint-front:
	cd breezy-front && npm run lint

seed:
	cd breezy-back && \
	docker compose up -d && \
	docker compose exec auth npm run seed
