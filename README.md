# Onboard Project: CRUD data in the database

## Description

This onboard project aims to introduce new developers to become familiar with the technology stack, patterns and best practices applied to projects in general. This project is focused on creating a database and training CRUD manipulation on the data.

To run this project, use **Node v12.17.0**.

## Environment and tools

These are the main tools and technologies applied in this project:

- [Apollo Server](https://www.apollographql.com/docs/apollo-server/)
- [Docker](https://www.docker.com/)
- [GraphQL](https://graphql.org/)
- [Node.js](https://nodejs.org/en/)
- [PostgreSQL](https://www.postgresql.org/)
- [Typescript](https://www.typescriptlang.org/)
- [TypeORM](https://typeorm.io/#/)

To start, clone this repository and run the command bellow in the terminal to install all packages.

```sh
npm install
```

## Steps to run and debug

- **Database**

  1. To initialize the database, use the command: `npm run docker`
  2. To seed the database, use: `npm run seed`

- **Start**

  1. Build the project by running the command: `npm run build`
  2. Run the **start** script: `npm run start`

- **Debug**

  - To debug the project, you can run the command: `npm run dev`

- **Test**
  - Run automated tests with: `npm run test`
