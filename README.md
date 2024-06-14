# PaperKitchen REST API

This repository is a dedicated REST API for [paperkitchen.ca](https://paperkitchen.ca) and is hosted via [adaptable.io](https://adaptable.io).

## Database

This REST API connects to a PostgreSQL database and uses Prisma as an ORM. I used PostgreSQL because the data was highly relational and structured, and Prisma allowed for more efficient data validation, modeling, and querying/mutating.

The structure of the database is very simple, you can actually view it [here](https://drawsql.app/teams/adnan-radwan/diagrams/cook-book), but essentially it consists of 3 tables; users, recipes, and grocery_lists. These tables store all the unique information for their respective resources and each of the non-user tables is connected to the users table via a many-to-many relationship facilitated by join tables. This is because a user can have multiple recipes, but due to the sharing feature, a recipe can be possessed by many users.

## Authorization

Upon successful authentication, the backend generates a JSON Web Token(JWT). This JWT is sent along with some of the user's information to the client. The client stores the JWT in local storage and via an axios request interceptor which adds the token to the authorization header for every request that goes through a protected resource. When the backend receives each request it goes through the protect middleware which decodes the JWT. If the JWT is valid the user's id is set to req.userId and it can then be used to access the resources they have access to in the database.

### Local storage vs cookies

As with a lot of things in programming, there isn't necessarily a 'correct' method. The two most common ways of storing the JWT access token are in cookies and local storage. Each possesses unique benefits AND vulnerabilities. I used the local storage method before so in this project I wanted to use cookies. Once I did so everything was working fine up until I published the web app and began user testing. I quickly found out that the Safari browser only allows cookies to be set from same site sources. Since my backend was hosted on [adaptable.io](https://adaptable.io) I could not change its domain to be a subdomain of [paperkitchen.ca](https://paperkitchen.ca), thus I needed to convert my authentication to utilize local storage.

## API Documentation

This repository includes REST API documentation with Swagger UI, an interactive interface for exploring and testing API endpoints.

You can access the API documentation by navigating to [https://paperkitchen.adaptable.app/api/docs](https://paperkitchen.adaptable.app/api/docs) . This interface allows you to view all available API endpoints, their expected parameters, and responses.
