# Money-Lending-App
A Money Lending App that approves application during signup, runs a Login API, shows User data and runs an API to borrow Money

This app has 4 segments which each require some components express or mongo or JWt to be imported for it to be setup:
1. **Approve Application During Signup**
npm init -y
npm install express mongoose body-parser
2. **Login API**
npm install bcryptjs jsonwebtoken
3. **Show User Data**
npm install express-jwt
4. **Borrow Money API**

Now, to test if each component is working , you have to run node app.js, then open postman while the server is still live , run a net API call and set the call to the required call you nedd , like GET , POST etc.
The procedures required in the postman is further explained in detail in postman.txt file.
