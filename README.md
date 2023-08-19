# PaperKitchen REST API

This repository is a dedicated REST API for [paperkitchen.ca](https://paperkitchen.ca) and is hosted via [adaptable.io](https://adaptable.io).

## Database

This REST API connects to a PostgreSQL database and uses Prisma as an ORM. I used PostgreSQL because the data was highly relational and structured, and Prisma allowed for more efficient data validation, modeling, and querying/mutating.

The structure of the database is very simple, you can actually view it [here](https://drawsql.app/teams/adnan-radwan/diagrams/cook-book), but essentially it consists of 3 tables; users, recipes, and grocery_lists. These tables store all the unique information for their respective resources and each of the non-user tables is connected to the users table via a many-to-many relationship facilitated by join tables. This is because a user can have multiple recipes, but due to the sharing feature, a recipe can be possessed by many users.

## Authorization

Upon successful authentication, the backend generates a JSON Web Token(JWT). This JWT is sent along with some of the user's information to the client. The client stores the JWT in local storage and via an axios request interceptor which adds the token to the authorization header for every request that goes through a protected resource. When the backend receives each request it goes through the protect middleware which decodes the JWT. If the JWT is valid the user's id is set to req.userId and it can then be used to access the resources they have access to in the database.

### Local storage vs cookies

As with a lot of things in programming, there isn't necessarily a 'correct' method. The two most common ways of storing the JWT access token are in cookies and local storage. Each possesses unique benefits AND vulnerabilities. I used the local storage method before so in this project I wanted to use cookies. Once I did so everything was working fine up until I published the web app and began user testing. I quickly found out that the Safari browser only allows cookies to be set from same site sources. Since my backend was hosted on [adaptable.io](https://adaptable.io) I could not to change its domain to be a subdomain of [paperkitchen.ca](https://paperkitchen.ca), thus I needed to convert my authentication to utilize local storage.

## Endpoints

### User Routes

-   **GET /users**

    -   Protected route to get user information.

-   **POST /users/register**

    -   Register a new user.

-   **POST /users/login**
    -   Log in a user.

### Recipe Routes

-   **GET /recipes**

    -   Get the most recent list of recipes or filtered list of recipes.

-   **POST /recipes**

    -   Create a new recipe.

-   **PUT /recipes/:id**

    -   Update a recipe by ID.

-   **DELETE /recipes/:id**

    -   Delete a recipe by ID.

-   **GET /recipes/:id/permissions**

    -   Get sharing permissions for a recipe.

-   **POST /recipes/:id/permissions**

    -   Create a shareable URL for a recipe.

-   **PUT /recipes/:id/permissions**

    -   Update sharing permissions for a recipe.

-   **DELETE /recipes/:id/permissions**
    -   Remove sharing permissions for a recipe.

### Grocery List Routes

-   **GET /grocery-lists**

    -   Get a list of grocery lists.

-   **POST /grocery-lists**

    -   Create a new grocery list.

-   **PUT /grocery-lists/:id**

    -   Update a grocery list by ID.

-   **DELETE /grocery-lists/:id**

    -   Delete a grocery list by ID.

-   **GET /grocery-lists/:id/permissions**

    -   Get sharing permissions for a grocery list.

-   **POST /grocery-lists/:id/permissions**

    -   Create a shareable URL for a grocery list.

-   **PUT /grocery-lists/:id/permissions**

    -   Update sharing permissions for a grocery list.

-   **DELETE /grocery-lists/:id/permissions**
    -   Remove sharing permissions for a grocery list.

### Join Routes

-   **GET /join/:url**

    -   Get JWT encrypted info from share link, such as sharer's and the recipe's/grocery list's name.

-   **POST /join/:url**
    -   Allows user to join recipe/grocery list.
