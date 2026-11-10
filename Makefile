# Build and preview the site.
#
# Docker is used so that no Ruby is needed on the host.
#   make build    build once into _site/
#   make serve    preview at http://localhost:4000/modern-se-in-ai/
#   make clean    remove the build output and caches
#
# Override the port if 4000 is taken: make serve PORT=4020

IMAGE := jekyll/jekyll:4.2.2
PORT  ?= 4000

.PHONY: build serve clean

build:
	docker run --rm -v "$(PWD):/srv/jekyll" -w /srv/jekyll $(IMAGE) jekyll build

serve:
	docker run --rm -it -p $(PORT):4000 -v "$(PWD):/srv/jekyll" -w /srv/jekyll $(IMAGE) jekyll serve --host 0.0.0.0 --livereload

clean:
	rm -rf _site .jekyll-cache .jekyll-metadata
