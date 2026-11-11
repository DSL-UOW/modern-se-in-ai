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

You do not need to edit HTML to add or change items.

| File | What it holds |
|---|---|
| `_projects/<name>.md` | One research project page at `/research/<name>/`. Copy the example file. `PROJECT-TEMPLATE.md` lists the fields. |
| `_data/events.yml` | Industry and Community events, newest first. `category:` picks the page. |
| `_data/categories.yml` | The 3 categories: title, text, cover image |
| `_data/home.yml` | Hero and contact block text |
| `_data/nav.yml` | Top navigation and footer links |
| `_config.yml` | Site name, contact email, items per category page (`list_limit`), deploy URL |

Images go in `assets/img/`. Refer to them by file name only, for example `photo: hoa.png`.
The category covers are made by `python3 scripts/make_covers.py` (writes `assets/img/covers/`).

A category page shows `list_limit` items (10). With more items, a "View all" button opens `/<category>/all/`.

## Structure

```
_config.yml        site settings
_data/             content (YAML)
_projects/         one file per research project
_includes/         head, header, footer, cards, team, contact block, icons
_layouts/          default, category, project
index.html         home page: hero, 3 category cards, contact block
research/ industry/ community/   category pages (+ all/ for the full list)
404.html           not-found page
assets/            css, js (video window, dot pattern, mobile menu), img
scripts/           make_covers.py, verify.cjs (browser check)
```

## Deploy

The site deploys to GitHub Pages at <https://dsl-uow.github.io/modern-se-in-ai/>.

- `.github/workflows/pages.yml` builds the site with the `Gemfile` (Jekyll 4).
- Every pull request to `main` builds the site, so a broken build shows on the pull request.
- Every push to `main`, which includes a merged pull request, builds and deploys the site.
- In the repository settings, **Pages > Build and deployment > Source** must be **GitHub Actions**.

`baseurl` in `_config.yml` is `/modern-se-in-ai`. For a local preview, `make serve`
serves the site at <http://localhost:4000/modern-se-in-ai/>.
