# Portfolio Site
![CI](https://github.com/Karan-Manhas/Karan-Manhas.github.io/actions/workflows/ci.yml/badge.svg)
Using Github Pages. The domain is: https://karan-manhas.github.io/ 

# Live Site
https://karan-manhas.github.io/


# Overview
Portfolio showcases projects, technical notes, and engineering work across:

- AI 
- ML
- Cybersecurity
- Data Engineering
- Systems Programming

The site is intentionally lightweight and built using vanilla.

# Features
- Responsive
- Dark Mode support
- technical notes/blog section
- Github Pages deployment


# Tech Stack
- HTML
- CSS
- Javascript
- Github Pages

# CI/CD

This portfolio uses GitHub Actions to validate HTML structure and check links on each push or pull request to `main`.

CI also checks JavaScript syntax and internal link fragments. Absolute URLs for this
portfolio are mapped to files in the checkout, so new research pages and sharing
assets can be validated before GitHub Pages publishes them. Links to other projects
are still checked online. The link report is printed in the job log and summary.

The stylesheet and script URLs include a version query to refresh browser caches
after visual changes. When changing either asset, update its version consistently
in all five HTML pages. Preview with Live Server or `python -m http.server 8000`.

The site is deployed through GitHub Pages.


# Author
Karan 
Senior SWE in AI Systems, cybersecurity, data engineering.
