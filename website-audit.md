# Website Audit 7/10/2025

## PageSpeed Insights (Homepage)

- **Mobile**
- Performance: 8
- Accessibility: 84
- Best Practices: 93
- SEO: 85

- **Desktop**
- Performance: 33
- Accessibility: 87
- Best Practices: 74
- SEO: 85

## Suggestions

- Remove video from hero section (root cause for performance issues)
- Remove excessive & slow animations (https://cpec.com/applications/ - example)
- Structure equipment & applications information for programmatic SEO
- Clean the url structure (huge when it comes to site crawling)
  - https://cpec.com/why-coe/news/ news shouldn't be a child of why-coe
  - https://cpec.com/equipment/complete-lines/cut-to-length/ this link falls under Equipment & Applications
- Navbar is a mess - multiple links to the same pages (contacts), careers shouldn't be under contacts
- https://cpec.com/videos/ remove auto play, can't pause or stop the video in hero section
- Super weird scroll behavior on multiple pages - https://cpec.com/service/#pm-support
- Cookie & privacy policies should be on their own pages, not in modals

## Quick Wins

- Dynamic copyright year in footer
- Manifest (simple LLM friendly page) - What we do & for who, best applications, additional services / info
