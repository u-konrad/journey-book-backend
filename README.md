# JourneyBook Backend

Backend for the JourneyBook app.


## Setup

1. After you clone this repo to your desktop, go to its root directory and run `npm install` to install its dependencies.
2. For the app to work you have to set up your own free [Mongo Atlas Database](https://www.mongodb.com/atlas) and a [Cloudinary account](https://cloudinary.com/).
3. Next create a `nodemon.json` file in root folder, and then provide your own values for the following variables inside:
```json
{
    "env":{
        "DB_PASSWORD":"xxx",
        "DB_USER":"xxx",
        "DB_NAME":"xxx",
        "CLOUDINARY_NAME": "xxx",
        "CLOUDINARY_KEY":"xxx",
        "CLOUDINARY_SECRET":"xxx",
        "JWT_SECRET":"your_own_secret_here"
    }
}
```
4. Now you can run `nodemon app.js` in root directory to start the backend. You will then be able to access it at localhost:3001.
5. To connect the frontend: clone the [frontend repo](https://github.com/u-konrad/journey-book) to desktop, and provide the value REACT_APP_BACKEND_URL=http://localhost:3001/ inside `.env` file in frontend root folder.





