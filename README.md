# Coesco Web

[Node.js 22.15.1](https://nodejs.org/) | [GitHub Repository](https://github.com/jar-cpec/coesco-web) | [MIT License](LICENSE)

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/en/download) version 22.15.1 (LTS)
- npm (comes with Node.js)
- Git

## Installation

1. Clone the repository:

```bash
git clone https://github.com/jar-cpec/coesco-web.git
cd coesco-web
```

2. Install client dependencies:

```bash
cd client
npm install
```

3. Install server dependencies:

```bash
cd ../server
npm install
```

## Project Structure

```
coesco-web/
├── client/             # Frontend React application
├── server/             # Backend Node.js server
└── README.md           # Project documentation
```

## Configuration

1. Create environment configuration:

```bash
cp .env.template .env
```

2. Update the `.env` file with appropriate values for your environment:

## Development

Start both client and server applications in development mode:

```bash
npm run dev
```

- Client will be running at [http://localhost:5173](http://localhost:5173) (port will increment if 5173 is already in use)
- Server will be running at [http://localhost:8080](http://localhost:8080)

### Common Issues

1. **Port already in use**

   - The client will automatically try the next available port
   - For server port conflicts, modify the port in your `.env` file

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

Project Link: [https://github.com/jar-cpec/coesco-web](https://github.com/jar-cpec/coesco-web)

---

_For more information or support, please contact the repository maintainers._
