const cookieSession = require('cookie-session');
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const methodOverride = require("method-override");
const PORT = 8080;

const getUserByEmail = require('./helpers').getUserByEmail;
const getCreatedDate = require('./helpers').getCreatedDate;
const generateRandomString = require('./helpers').generateRandomString;
const urlsForUser = require('./helpers').urlsForUser;


/* THE URL DATABASE */
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
    dateCreated: '06/23/2019',
    visited: 2,
    uniqueVisits: 1
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
    dateCreated: '06/23/2019',
    visited: 2,
    uniqueVisits: 1
  }
};


/* THE USERS DATABASE */
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

/* THE MIDDLEWARES */
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['user_id']
}));
app.use(methodOverride('_method'));


/* GET "/" */
app.get("/", (req, res) => {
  // check if the user is logged in, and redirect to login page if not
  const user = users[req.session.userId];
  if (!user) {
    res.redirect("/login");
  } else {
    // user logged in, filter through the urlDatabase and render only the shortURLs that belongs to the user
    const urls = urlsForUser(user.id, urlDatabase);
    //update templateVars and render the urls page
    const templateVars = { urls: urls, user: user };
    res.render("urls_index", templateVars);
  }
});


/* GET "/URLS" */
app.get("/urls", (req, res) => {
  // check if the user is logged in, and redirect to login page if not
  const user = users[req.session.userId];
  if (!user) {
    const templateVars = {user: null};
    res.render("urls_index", templateVars);
  } else {
    // user logged in, filter through the urlDatabase and render only the shortURLs that belongs to the user
    const urls = urlsForUser(user.id, urlDatabase);
    //update templateVars and render the urls page
    const templateVars = { urls: urls, user: user };
    res.render("urls_index", templateVars);
  }
});


/* POST "/URLS" */
app.post("/urls", (req, res) => {
  const newURL = req.body.longURL;
  const shortURL = generateRandomString();
  const templateVars = { user: users[req.session.userId]};

  if (!newURL) {
    return res.status(401).send("Please enter a valid url to <a href='/register'> continue </a>");
  }
  //create a new short URL
  urlDatabase[shortURL] = {
    "longURL": newURL,
    "userID": templateVars.user["id"],
    "dateCreated": getCreatedDate(),
    "visited": 0,
    "uniqueVisits": 0
  };
  res.redirect(`/urls/${shortURL}`);
});


/* GET "/URLS/NEW" */
app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.session.userId]};
  const user = templateVars.user;
  if (!user) {
    return res.status(401).redirect("/login");
  } else {
    res.render("urls_new", templateVars);
  }
});


/* GET "/REGISTER" */
app.get("/register", (req, res) => {
  const templateVars = { user: users[req.session.userId], urls: null};
  const user = templateVars.user;
  if (!user) {
    res.render("userRegistration", templateVars);
  } else {
    const urls = urlsForUser(user.id, urlDatabase);
    
    //update templateVars and render the urls page
    const templateVars = { urls: urls, user: user };
    res.render("urls_index", templateVars);
  }
});


/* POST "/REGISTER" */
app.post("/register", (req, res) => {
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).send("Username and Password fields are mandatory and cannot be empty. Please <a href='/register'> Try Again </a>");
  }
  const user = getUserByEmail(email, users);
  if (user) {
    return res.status(400).send("A user with that email already exists. Please <a href='/login'> Try Again </a>");
  }
  const hashedPassword = bcrypt.hashSync(password, 10);
  users[id] = {id, email, password: hashedPassword};

  req.session.userId = id;
  res.redirect("urls");
});


/* GET "/LOGIN" */
app.get("/login", (req, res) => {
  const templateVars = { user: users[req.session.userId]};
  res.render("login", templateVars);
});


/* POST "/LOGIN" */
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const user = getUserByEmail(email, users);
  if (!user) {
    return res.status(403).send("The user with the email provided does not exist. Please <a href='/register'> Register</a>");
  }

  const checkPassword = bcrypt.compareSync(password, user.password);

  if (checkPassword === false) {
    return res.status(403).send("The password entered does not match any user. Please <a href='/login'> Try Again </a>");
  } else {
  
    req.session.userId = user.id;
    res.redirect("/urls");
  }
});


/* GET "/URLS/SHORTURL" */
app.get("/urls/:shortURL", (req, res) => {
  // check if the user is logged in, and redirect to login page if not
  const user = users[req.session.userId];
  if (!user) {
    const templateVars = { user: null};
    res.render("urls_index", templateVars);
  } else {
    const shortURL = req.params.shortURL;
    for (const url in urlDatabase) {
      if (shortURL === url) {
        if (urlDatabase[shortURL]["userID"] === user.id) {
          
          //increment the visit value
          urlDatabase[shortURL]["visited"] = urlDatabase[shortURL]["visited"] + 1;
          const templateVars = { shortURL: shortURL, longURL: urlDatabase[shortURL]["longURL"], user: user, visited: urlDatabase[shortURL]["visited"], uniqueVisits: urlDatabase[shortURL]["uniqueVisits"], created: urlDatabase[shortURL]["dateCreated"] };

          return res.render("urls_show", templateVars);
        } else {
          const templateVars = { shortURL: shortURL, longURL: null, user: user};
          return res.render("urls_show", templateVars);
        }
      }
    }
    return res.status(404).send("The short url entered does not exist. Please try again");
  }
});


/* GET "/U/SHORTURL" */
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  for (const url in urlDatabase) {
    if (shortURL === url) {
      const longURL = urlDatabase[shortURL]["longURL"];
      urlDatabase[shortURL]["uniqueVisits"] = urlDatabase[shortURL]["uniqueVisits"] + 1;
      return res.redirect(longURL);
    }
  }
  res.status(404).send("The short url entered does not exist. Please try again");
});


/* DELETE "/URLS/SHORTURL/DELETE" */
app.delete("/urls/:shortURL/", (req, res) => {
  const user = users[req.session.userId];
  if (!user) {
    res.status(401).send("You must be logged in to delete these urls. Please <a href='/login'> Login</a>");
  } else {
    const shortURL = req.params.shortURL;
    if (urlDatabase[shortURL].userID === user.id) {
      delete urlDatabase[shortURL];
      res.redirect("/urls");
    }
  }
});


/* GET "/URLS/SHORTURL/EDIT" */
app.get("/urls/:shortURL/edit", (req, res) => {
  const user = users[req.session.userId];
  if (!user) {
    res.status(401).send("You must be logged in to edit this url. Please <a href='/login'> Login</a>");
  } else {
    const shortURL = req.params.shortURL;
    if (urlDatabase[shortURL].userID === user.id) {
      res.redirect(`/urls/${shortURL}`);
    }
  }
});


/* POST "/URLS/SHORTURL/EDIT" */
app.put("/urls/:shortURL/", (req, res) => {
  const user = users[req.session.userId];
  if (!user) {
    return res.status(401).send("You must be logged in to edit this url. Please <a href='/login'> Login</a>");
  } else {
    const shortURL = req.params.shortURL;
    if (urlDatabase[shortURL].userID === user.id) {
      const newURL = req.body.longURL;
      urlDatabase[shortURL]["longURL"] = newURL;
      return res.redirect("/urls");
    }
  }
  
});


/* POST "/LOGOUT" */
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});




app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});