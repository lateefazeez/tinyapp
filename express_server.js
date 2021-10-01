const cookieSession = require('cookie-session');
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const PORT = 8080;

const getUserByEmail = require('./helpers').getUserByEmail;
const getCreatedDate = require('./helpers').getCreatedDate;
const generateRandomString = require('./helpers').generateRandomString;
const urlsForUser = require('./helpers').urlsForUser;

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

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
//app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: ['user_id', 'visited']
}));

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

app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.session.userId]};
  const user = templateVars.user;
  if (!user) {
    return res.status(401).redirect("/login");
  } else {
    res.render("urls_new", templateVars);
  }
});

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

app.get("/login", (req, res) => {
  const templateVars = { user: users[req.session.userId]};
  res.render("login", templateVars);
});

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
  //res.cookie("user_id", id);
  req.session.userId = id;
  res.redirect("urls");
});

app.post("/urls", (req, res) => {
  const newURL = req.body.longURL;
  const shortURL = generateRandomString();
  const templateVars = { user: users[req.session.userId]};
  urlDatabase[shortURL] = {
    "longURL": newURL,
    "userID": templateVars.user["id"],
    "dateCreated": getCreatedDate(),
    "visited": 0,
    "uniqueVisits": 0
  };
  res.redirect(`/urls/${shortURL}`);
});

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

app.post("/urls/:shortURL/delete", (req, res) => {
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

app.post("/urls/:shortURL/edit", (req, res) => {
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
    //res.cookie("user_id", user.id);
    req.session.userId = user.id;
    res.redirect("/urls");
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.get("/u/", (req, res) => {
  res.status(404).send("Error 404 Page Not Found");
});


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});