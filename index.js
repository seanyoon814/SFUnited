const express = require('express')
const axios = require('axios')
const session = require('express-session')
const path = require('path')
const PORT = process.env.PORT || 5000
const { Pool } = require('pg');
const { query } = require('express')
const { resolve } = require('path')
var pool;
pool = new Pool({
  connectionString: process.env.DATABASE_URL, 
  ssl: {
      rejectUnauthorized: false
    }
})

var letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']
var app = express()
var isAdmin = 0;
app.use(session({
  name: 'session',
  secret: 'zordon',
  resave: false,
  saveUninitialized: false,
  maxAge: 30 * 60 * 1000  // 30 minutes
}))
app.use(express.json());
app.use(express.urlencoded({extended:false}))
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  if(req.session.user)
  {
    res.redirect('/dashboard')
  }
  else
  {
    res.render('pages/index')
  }
})
app.listen(PORT, () => console.log(`Listening on ${ PORT }`))

app.post('/', async (req,res)=> {
  var un = req.body.f_uname
  var pwd = req.body.f_pwd
  const bool = await checkUsers(un, pwd)
  if(Number(bool) == 2 && isAdmin == 1)
  {
    req.session.user = req.body
    res.redirect('/admin')
  }
  else if(Number(bool) == 1)
  {
    req.session.user = req.body
    res.redirect('/dashboard')
  }
  else{
      res.redirect('/')
  }
})
app.get('/createaccount', (req, res)=>{
  res.render('pages/createaccount')
})
app.get('/logout', (req, res)=>{
  req.session.destroy();
  isAdmin = 0;
  res.redirect('/')
})
app.post('/createaccount', (req, res)=>{
  var un = req.body.f_uname
  var pwd = req.body.f_pwd
  var fname = req.body.f_fname
  var lname = req.body.f_lname
  // test
  var queryString = `
  INSERT INTO usr (fname, lname, uname, fpassword)
  VALUES ('${fname}', '${lname}', '${un}', '${pwd}')
  `;
  pool.query(queryString, (error, response)=>{
    if(error)
    {
      res.send(error)
    }
    else
    {
      res.redirect('/')
    }
  })
})
app.get('/admin', (req, res)=>{
  //user is an admin
  if(req.session.user && isAdmin == 1)
  {
    var getUsersQuery = `SELECT * FROM usr`;
    pool.query(getUsersQuery, (error, result)=>{
      var results = {'rows':result.rows}
      res.render('pages/admin', results)
    })
  }
  //user is logged in, but not an admin
  else if(req.session.user)
  {
    res.redirect('/dashboard')
  }
  //user is not logged in
  else
  {
    res.redirect('/')
  }
})
app.get('/dashboard', (req,res)=>{
  if (req.session.user)
  {
    var results = {'name': req.session.user.f_uname}
    res.render('pages/dashboard', results)
  }
  else
  {
    res.redirect('/')
  }
})

app.get('/schedule', (req, res)=>{
  var firstName = req.body.f_fname
  var lastName = req.body.f_lname
  var subj = req.body.f_subject
  scrape(firstName, lastName, subj);
  res.render('pages/schedule')
})

//Function to check if logged in users are registered in "usr" table.
//Returns 1 if there is
//returns 2 if the logged in user is an admin
//0 otherwise (err)
function checkUsers(name, password)
{
  //create a promise 
  return new Promise((resolve, reject)=>
  {
    if(name.trim() == 'admin' && password.trim() == 'admin')
    {
      isAdmin = 1;
      resolve(2);
    }
    var getUsersQuery = `SELECT * FROM usr`;
    setTimeout(() => {
      pool.query(getUsersQuery, (error, result)=>{
        if(error)
          resolve(0);
        var results = {'rows':result.rows}
        for(var i = 0; i<results.rows.length; i++)
        {
          var r1 = results['rows'][i]['uname'].toString()
          var r2 = results['rows'][i]['fpassword'].toString()
          if(r1.trim() == name.trim() && r2.trim() == password.trim())
          {
            resolve(1);
            return 1;
          }
        }
        resolve(0);
        return 0;
    }, 100)})
  })
}

//webscrape api
async function scrape(firstName, lastName, subject)
{
  for(let i = 0; i<letters.length; i++)
  {
    const url = 'https://ratemyprof-api.vercel.app/api/getProf?first=' + firstName + '&last=' + lastName + '&schoolCode=U2Nob29sLTE0Nj' + letters[i]
    console.log(url)
    const { data } = await axios.get(url);
    try
    {
      if(data['ratings'][i]['class'].includes(subject))
      {
        console.log(data['firstName'])
        console.log(data['lastName'])
        console.log(data['avgRating'])
        {break;}
      }
    }
    catch(err){

    }
  }
}

