# README

## To Do

- Setup proper artifact transfer with rsync
- Setup proper CI/CD for sever
- Add ability to reset the fanuc adapter from portal

## Tools

- GitHub Teams ($4/user/month - enables branch protection & rulesets for private repos)
- Azure Key Vault ($0.03 per 10,000 transactions - cache keys on startup to reduce calls)
- Vercel Pro ($20/user/month - can get by with one account)
- Google API (free with limits)


## Notes

dotnet publish -c Release -r linux-arm64 --self-contained true -o ./out
