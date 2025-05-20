# To Do

## Client

- Handle rate limit (429) - currently flagging system unavailable
- Eliminate use of useEffect where possible
- Make charts components
- Add home button to mobile sidebar
- Add date picker to mobile page header
- Make mobile date picker a modal
- Complete timeline modal

## Server

- Passing "options.maxAge" into cookies is deprecated
- Ability to toggle polling on server & adapter

## Infrastructure

- Azure key vault
- Test environment
- Branch protection with 1 mandatory review
- Webhooks for fatal server & adapter errors
- Shared types package
- Shared linter

## Settings Values

- Fanuc adapter ip
- Fanuc adapter port
- Default machine utilization per weekday
- Override value per machine (can be added to machine table, config value if null)
