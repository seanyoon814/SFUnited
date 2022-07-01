const express = require('express')
const axios = require('axios')
const session = require('express-session')
const path = require('path')
const PORT = process.env.PORT || 5000
const { Pool } = require('pg');
const { query } = require('express')
var pool;
pool = new Pool(
  {
    connectionString: 'postgres://postgres:elchapo0814@localhost/users'
  })
var letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']
async function scrape(firstName, lastName, subject)
{
  console.log("Ran")
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
var app = express()
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

app.get('/login', (req, res)=>{
  res.render('pages/login')
})
async function checkUsers(name, password)
{
  var getUsersQuery = `SELECT * FROM usr`;
  pool.query(getUsersQuery, (error, result)=>{
    if(error)
      res.send(error);
    var results = {'rows':result.rows}
    for(var i = 0; i<results.rows.length; i++)
    {
      var r1 = results['rows'][i]['fname'].toString()
      var r2 = results['rows'][i]['fpassword'].toString()
      if(r1.trim() == name.trim())
      {
        console.log("Ran")
        return 1;
      }
    }
    return 0;
  })
}
app.post('/', async (req,res)=> {
  var un = req.body.f_uname
  var pwd = req.body.f_pwd
  // var queryString = `
  // INSERT INTO usr (fname, fpassword)
  // VALUES ('${un}', '${pwd}')
  // `;
  var bool = await checkUsers(un, pwd)
  console.log(bool)
  if(Number(bool) == 1)
  {
    console.log("Ran here")
    req.session.user = req.body
    res.redirect('/dashboard')
  }
  else{
      res.redirect('/')
  }
  // else
     // invalid user
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

