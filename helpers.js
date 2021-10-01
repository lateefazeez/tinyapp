const getUserByEmail = (userEmail, database) => {
  for (const userId in database) {
    const user = database[userId];
    if (user.email === userEmail) {
      return user;
    }
  }
  return null;
};

const getCreatedDate = () => {
  const dateCreated = new Date();
  let day = dateCreated.getDate();
  let month = dateCreated.getMonth();
  let year = dateCreated.getFullYear();

  if (day < 10) day = `0${day}`;
  if (month < 10) month = `0${month}`;

  return `${month}/${day}/${year}`;
};

const generateRandomString = () => {
  let result = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() *
    charactersLength));
  }
  return result;
};

const urlsForUser = (id, database) => {
  let urls = {};
  for (const url in database) {
    const userid = database[url].userID;
    if (userid === id)
      urls[url] = database[url];
  }
  return urls;
};

module.exports = { getUserByEmail, getCreatedDate, generateRandomString, urlsForUser };