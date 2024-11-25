# About

muonium is a crossplatform cloud storage web app, built with a variety of modern tools and libraries

muonium-server is built with Express, Jest+Supertest, Prisma+PostgreSQL, Dragonfly (Redis)

Client repo: https://github.com/StingrayFG/muonium-client/

### Real world example

See the real world example at https://muoniumdrive.com

# Server features

- Custom directories handling, built from scratch
- Supports traversing and managing directories based on their absolute path
- Files & folders metadata is stored purely in the database
- Bookmarks support
- JWT auth - all requests get authenticated

# Todo

- Separate files, folders & bookmarks logic into a completely self sufficient unit in order to move closer towards the implementation of clustered server architecture
- Add more tests to cover a wider range of possible issues

