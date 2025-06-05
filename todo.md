# To Do

## Client

- Handle rate limit (429) - currently flagging system unavailable
- Eliminate use of useEffect where possible
- Make charts components
- Add home button to mobile sidebar
- Add date picker to mobile page header
- Make mobile date picker a modal
- Complete timeline modal
- Make table header sticky
- Setup app & layout commands

## Server

- Passing "options.maxAge" into cookies is deprecated
- Ability to toggle polling on server & adapter
- Assume gaps in machine statuses are offline

## Infrastructure

- Azure key vault
- Test environment
- Branch protection with 1 mandatory review
- Webhooks for fatal server & adapter errors

## AI

- Generate a readme per program file to allow for a searchable database

## To Do

- Add activity to journey
- Linter
- Bring typed value to create mode on enter key press

Quote visibility =
IF journeyId IS NULL → only creator can see
IF journey.customer.status = DRAFT → only creator can see  
 ELSE → everyone can see (real customer quotes)

## Questions

- Is the rsm determined based on customer location, salesman or both?
- Can two quotes from the same journey have different dealers, contacts or addresses?
