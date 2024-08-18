tag=latest

all: run

run:
	yarn start

build:
	yarn build

docker: build
	docker build -t kobums/apple_music_playlist_front:$(tag) .

push: docker
	docker push kobums/apple_music_playlist_front:$(tag)

dummy:
