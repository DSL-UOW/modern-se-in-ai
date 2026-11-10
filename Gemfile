source "https://rubygems.org"

gem "jekyll", "~> 4.2"

# Ruby 3 dropped webrick from the standard library, and `jekyll serve`
# needs it to serve the site.
gem "webrick", "~> 1.8"

# Windows and JRuby do not ship zoneinfo data.
gem "tzinfo", ">= 1", "< 3", platforms: [:mingw, :x64_mingw, :mswin, :jruby]
gem "tzinfo-data", platforms: [:mingw, :x64_mingw, :mswin, :jruby]
