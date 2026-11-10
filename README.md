# Decision Systems Lab website

Jekyll site for the Decision Systems Lab, University of Wollongong.

## Build and preview

Docker is the only requirement.

```bash
make serve            # preview at http://localhost:4000/modern-se-in-ai/
make serve PORT=4020  # if port 4000 is taken
make build            # build once into _site/
```

With Ruby and Bundler on the host, `bundle install && bundle exec jekyll serve` also works.

## Where to edit content

All content is in `_data/`. You do not need to edit HTML to add or change items.

| File | Section |
|---|---|
| `_data/home.yml` | Hero, section headings, contact block text |
| `_data/projects.yml` | Project cards (one item per card; field list at the top of the file) |
| `_data/events.yml` | Industry timeline (newest first) |
| `_data/nav.yml` | Top navigation and footer links |
| `_config.yml` | Site name, address, deploy URL, shared links |

Images go in `assets/img/`. Refer to them by file name only, for example `photo: hoa.png`.

## Structure

```
_config.yml        site settings
_data/             content (YAML)
_includes/         head, header, footer, section heading, project card, icons
_layouts/          default.html
index.html         home page (Liquid template)
404.html           not-found page
assets/css/        main.css
assets/js/         main.js (project details button, video window, hero dots, mobile menu)
assets/img/        images
```

## Deploy

The site deploys to GitHub Pages at <https://dsl-uow.github.io/modern-se-in-ai/>.

- `.github/workflows/pages.yml` builds the site with the `Gemfile` (Jekyll 4).
- Every pull request to `main` builds the site, so a broken build shows on the pull request.
- Every push to `main`, which includes a merged pull request, builds and deploys the site.
- In the repository settings, **Pages > Build and deployment > Source** must be **GitHub Actions**.

`baseurl` in `_config.yml` is `/modern-se-in-ai`. For a local preview, `make serve`
serves the site at <http://localhost:4000/modern-se-in-ai/>.
