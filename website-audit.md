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

- Remove video from hero section (root cause of performance issues)
- Remove excessive & slow animations (300ms max) (https://cpec.com/applications/ - example)
- Structure equipment & applications information for programmatic SEO
- Clean the url structure (huge when it comes to site crawling)
  - https://cpec.com/why-coe/news/ news shouldn't be a child of why-coe
  - https://cpec.com/equipment/complete-lines/cut-to-length/ this link falls under Equipment & Applications
- Navbar is a mess - multiple links to the same pages (contacts), careers shouldn't be under contacts, etc
- https://cpec.com/videos/ remove auto play, can't pause or stop the video in hero section
- Super weird scroll behavior on multiple pages - https://cpec.com/service/#pm-support
- Cookie & privacy policies should be on their own pages, not in modals
- Remove all fragment identifiers
- Search is only for articles - should be for equipment, applications, parts & services
- E-commerce store front for parts - more of a business decision but people don't want to call if they know what they need
- Overall design rework
- GET GOOGLE REVIEWS. 7 reviews total. 3.7 stars. why would google show us?

## Quick Wins

- Dynamic copyright year in footer
- Manifest (simple LLM friendly page) - What we do & for who, best applications, additional services / info
