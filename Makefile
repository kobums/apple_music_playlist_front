tag=latest

all: run

run:
	npm run dev

build:
	npm run build

typecheck:
	npm run typecheck

# 이미지 빌드는 멀티스테이지 Dockerfile 안에서 처리하므로 호스트 빌드에 의존하지 않는다.
docker:
	docker build -f dockerfile -t kobums/apple_music_playlist_front:$(tag) .

push: docker
	docker push kobums/apple_music_playlist_front:$(tag)

dummy:
