const { group } = require('console');
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const session = require('express-session');

app.use(session({
  secret: 'your-secret-key', // Replace with a secret key for session encryption
  resave: false,
  saveUninitialized: false
}));


app.use(express.static(path.join(__dirname, 'public')));

app.post('/register', (req, res) => {
  const { username, password, confirmPassword } = req.body;

  if (password !== confirmPassword || password.length < 8) {
    const errorMessage = password !== confirmPassword
      ? 'Passwords do not match'
      : 'Password must be at least 8 characters long';

    return res.send(
      `<script>alert('${errorMessage}'); window.location.href='/';</script>`
    );
  }

  const userData = {
    username,
    password,
    group:[],
    expenses:[],
    owes:[]
   
  

  };

  let users = [];
  const usersFilePath = path.join(__dirname, 'users.json');

  try {
    const exist = fs.readFileSync(usersFilePath, 'utf8');
    users = JSON.parse(exist);
  } catch (err) {

  }


  if (users.some(user => user.username === userData.username)) {
    return res.send(
      `<script>alert('Username already taken'); window.location.href='/';</script>`
    );
  }



  users.push(userData);

  

  fs.writeFileSync(usersFilePath, JSON.stringify(users));

  return res.redirect('/login');
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
  console.log(req.body);
});


app.post('/login', (req, res) => {
  const { username, password } = req.body;
  curname = username;

  const usersFilePath = path.join(__dirname, 'users.json');
  const users = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));

  const user = users.find((user) => user.username === username && user.password === password);
  if (user) {
    // Set the username in the session
    req.session.username = username;
  

    return res.redirect(`/home.html?username=${encodeURIComponent(username)}`);
  } else {
    return res.send(
      `<script>alert('Invalid credentials'); window.location.href='/login';</script>`
    );
  }
});


app.get('/home', (req, res) => {
  const { username } = req.query;
  res.send(`<h2>Welcome, ${username}!</h2>`);
});





app.get('/getUsers', (req, res) => {
  const usersFilePath = path.join(__dirname, 'users.json');
  const users = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));

  res.json(users);
});

app.get('/getGroupMembers', async (req, res) => {
  const usersFilePath = path.join(__dirname, 'users.json');
  const users = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));

  const currentUser =  users.find(user => user.username === req.session.username);

  res.json(currentUser);
});

app.post('/addMember', (req, res) => {
  const { memberName } = req.body;
  const usersFilePath = path.join(__dirname, 'users.json');
  const users = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));

  const user = users.find(user => user.username === memberName);
  if (user) {
    const currentUser = users.find(user => user.username === req.session.username);
    if (!currentUser.group.includes(memberName)) {
      currentUser.group.push(memberName);
      fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
      res.json({ message: 'Member added to the group' });
    } else {
      res.json({ error: 'Member is already in the group' });
    }
  } else {
    res.json({ error: 'User not found. Check the username' });
  }
});

app.post('/removeMember', (req, res) => {
  const { memberName } = req.body;
  const usersFilePath = path.join(__dirname, 'users.json');
  const users = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));

  const user = users.find(user => user.username === memberName);
  if (user) {
    const currentUser = users.find(user => user.username === req.session.username);
    const index = currentUser.group.indexOf(memberName);
    if (index !== -1) {
      currentUser.group.splice(index, 1);
      fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
      res.json({ message: 'Member removed from the group' });
    } else {
      res.json({ error: 'Member is not found in the group' });
    }
  } else {
    res.json({ error: 'User not found. Check the username' });
  }
});





//////////////////////////expense code///////////////////////////








// Endpoint to handle adding an expense
app.post("/addExpense", (req, res) => {
  const { expenseName, expenseDate, expenseAmount, payees, expenseDivision } = req.body;

  // Find the current user from t (assuming it is stored in req.session.user)
    const usersFilePath = path.join(__dirname, 'users.json');
  const users = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));

   let curUser=users.find(user=>user.username===req.session.username);
   

  // Calculate the amount to be split per member based on the expense division
  let amountPerMember;
  if (expenseDivision === "equal") {
    amountPerMember = expenseAmount / payees.length;
  } else if (expenseDivision === "unequal") {
    // Implement logic to handle unequal expense division (if needed)
    // For example, you can provide a form field for users to enter individual amounts for each member.
    // This part depends on your specific requirements.
  } else {
    return res.status(400).json({ error: "Invalid expense division type." });
  }

  // Add the expense to the current user's expenses
  let newExpense = {
    expenseName,
    expenseDate,
    expenseAmount,
    payees,
    expenseDivision,
    payer: req.session.username,
    status: "UNSETTLED"
  };
  curUser.expenses.push(newExpense);
  console.log(curUser);

console.log(newExpense.payees);
  // Update the user group amounts
  newExpense.payees.map(memberName => {
    if (memberName !== req.session.username) {
      const member = users.find(user => user.username === memberName);
      console.log(member);
      if (member) {
        member.owes.push({
          payer: req.session.username,
          amount: amountPerMember,
          status: "UNSETTLED",
          expenseName: expenseName
        });
      }
    }
  });
  fs.writeFileSync("./users.json", JSON.stringify(users, null, 2));

  res.json({ message: "Expense added successfully!", expense: newExpense });
});

// Endpoint to get the owes information for the current user
app.get("/getOwes", (req, res) => {

  let users=JSON.parse(fs.readFileSync('./users.json'));
 let  currentUser=users.find(user => user.username === req.session.username);

 
  
  res.json( currentUser.owes );
});

// Endpoint to update the status of an expense to SETTLED
app.post("/sendToApproval", (req, res) => {
  const { expenseName } = req.body;


  let users=JSON.parse(fs.readFileSync('./users.json'));
  const currentUser = users.find(user => user.username === req.session.username);

  

  const expense = currentUser.expenses.find(expense => expense.expenseName === expenseName);

  if (!expense || expense.status !== "UNSETTLED") {
    return res.status(400).json({ error: "Expense not found or status is not UNSETTLED." });
  }

  expense.status = "UNDER VEIW";
  fs.writeFileSync("./users.json", JSON.stringify(users, null, 2));

  res.json({ message: "Expense status updated to UNDER VIEW." });
});








// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
