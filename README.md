# PaperKitchen REST API

This repository is a dedicated REST API for [paperkitchen.ca](https://paperkitchen.ca) and is hosted via AWS EC2.

## Database

This REST API connects to a PostgreSQL database and uses Prisma as an ORM. I used PostgreSQL because the data was highly relational and structured, and Prisma allowed for more efficient data validation, modeling, and querying/mutating.

The structure of the database is very simple, you can view it [here](https://drawsql.app/teams/adnan-radwan/diagrams/cook-book), but essentially it consists of 3 tables; users, recipes, and grocery_lists. These tables store all the unique information for their respective resources and each of the non-user tables is connected to the users table via a many-to-many relationship facilitated by join tables. This is because a user can have multiple recipes, but due to the sharing feature, a recipe can be possessed by many users.

## Authorization

Upon successful authentication, the backend generates a JSON Web Token(JWT). This JWT is sent along with some of the user's information to the client. The client stores the JWT in local storage and via an axios request interceptor which adds the token to the authorization header for every request that goes through a protected resource. When the backend receives each request it goes through the protect middleware which decodes the JWT. If the JWT is valid the user's id is set to req.userId and it can then be used to access the resources they have access to in the database.

## API Documentation

This repository includes REST API documentation with Swagger UI, an interactive interface for exploring and testing API endpoints.

You can access the API documentation by navigating to [https://api.paperkitchen.ca/api/docs](https://api.paperkitchen.ca/api/docs). This interface allows you to view all available API endpoints, their expected parameters, and responses.
