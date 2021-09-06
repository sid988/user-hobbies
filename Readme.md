# User Hobbies service
A simple REST based endpoint to have CRUD operations around users and their related hobbies

## What do we need to run the service?
- Docker
- Node

## How to run the project?
- Start the docker image for the database. We need to do this step only once.
    `npm run init-db`
- Start the service using below command.
    `npm run start`

## Swagger
- The swagger setup in this project is basic we need to follow below steps:
    - Browse for [Swagger Editor: https://editor.swagger.io/]
    - Refer to the file `swagger.yaml`
    - Copy & paste the contents to check the endpoints and their parameters

## Unit Test
- The unit test has been set up using jest and we have covered the below test cases:
    - A happy path scenario to check if we can add a user
[Note: We are only covering a single test case for now, if needed we can do 1 more iteration to cover all possible test cases]

## Validations & Error handling
- Each endpoint performs a set of validations
    - Schema & input validation using `validateSchema` function in local scope
    - Custom validations to check if the user or hobby already exists
        - to avoid duplicate user or hobby
        - as a check before update and delete operations
    - The update hobby endpoint has a validation to ensure if the new user already has a hobby with same name
- Each validation logic then returns an exception, using custom classses `Response500Error` and `Response404Error`
- We are using the 500 and 404 status to either say there is some error or the user or hobby was not found
- There is also a provision for internal message which is getting logged as part of the error handler middleware at the end in `src/api/index.ts`