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
  connectionString: 'postgres://postgres:elchapo0814@localhost/users'
})

var letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O',
'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']
var app = express()
var isAdmin = 0;
var user;
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
  user = un
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
  res.render('pages/createaccount', {bool: false})
})
app.get('/logout', (req, res)=>{
  req.session.destroy();
  isAdmin = 0;
  res.redirect('/')
})
app.post('/createaccount', async (req, res)=>{
  var un = req.body.f_uname
  var pwd = req.body.f_pwd
  var fname = req.body.f_fname
  var lname = req.body.f_lname
 
  // test
  if(hasNumber(fname) == true || hasNumber(lname) == true)
  {
    var str = "Try again. Don't include numbers in first name or last name."
    // res.redirect('createaccount');

    //var incorrect = {'state': true};
    res.render('pages/createaccount', {bool: true});
  }
  else
    {
    var queryString = `
    INSERT INTO usr (fname, lname, uname, fpassword)
    VALUES ('${fname}', '${lname}', '${un}', '${pwd}')
    `;
    const bool = await checkExistingUser(un)
    if(bool == 0)
    {
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
    }
    else
    {
      var str = 'An account with this username already exists.'
      res.redirect('/createaccount')
    }
  }
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
  // var firstName = req.body.f_fname
  // var lastName = req.body.f_lname
  // var subj = req.body.f_subject
  // scrape(firstName, lastName, subj);
  res.render('pages/schedule')
})

app.post('/schedule', async (req, res)=>{
  var course = req.body.fcourse
  var firstName = req.body.fname
  var subj = req.body.subj
  if(firstName && subj)
  {
    var arr = [];
    await scrape(firstName, subj, arr)
    console.log(arr)
  }
  if(course)
  {
    var arr = [];
    await getCourseInformation(course, arr)
    // var poolQuery = `INSERT into students values('${user}', '${})`
    console.log(arr)
  }
  res.redirect('/schedule')
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
//function to check duplicate users when registering
function checkExistingUser(name)
{
  //create a promise 
  return new Promise((resolve, reject)=>
  {
    var getUsersQuery = `SELECT * FROM usr`;
    setTimeout(() => {
      pool.query(getUsersQuery, (error, result)=>{
        if(error)
          resolve(0);
        var results = {'rows':result.rows}
        for(var i = 0; i<results.rows.length; i++)
        {
          var r1 = results['rows'][i]['uname'].toString()
          if(r1.trim() == name.trim())
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

//returns sections from courses
//input: course (e.g., CMPT 120)
//output:
async function getCourseInformation(course, courseInfo)
{
  //split the input (course) into the course code and course numbers, e.g. input = CMPT 120 => courseLetters = 'cmpt' courseNumbers = '120'
  var formattedStr = course.trim()
  var index = formattedStr.search(/[0-9]/);
  const courseLetters = formattedStr.slice(0, index-1).toLowerCase();
  const courseNumbers = formattedStr.slice(index, 8);
  var url = 'https://www.sfu.ca/bin/wcm/course-outlines?2022/fall/' + courseLetters + '/' + courseNumbers + '/'
  const {data} = await axios.get(url);
  let i = 0;
  //variable to print the information of the course only once
  let hasRan = 0;
  while(i<data.length)
  {
    const sectionurl = url + data[i]['value']
    try{
      const sectionData = await axios.get(sectionurl)
      if(hasRan == 0)
      {
        courseInfo.push(sectionData['data']['info']['description'], sectionData['data']['info']['prerequisites'], sectionData['data']['info']['notes'])
        hasRan = 1
      }
      if(sectionData['data']['courseSchedule'][0]["sectionCode"]=="LEC")
      {
        var arr = []
        arr.push(sectionData['data']['info']['name'], sectionData['data']['info']['term'], sectionData['data']['instructor'][0]['name'], sectionData['data']['courseSchedule'][0]["campus"],
        sectionData['data']['courseSchedule'][0]["buildingCode"], sectionData['data']['courseSchedule'][0]["roomNumber"], sectionData['data']['courseSchedule'][0]["days"], sectionData['data']['courseSchedule'][0]["startTime"], sectionData['data']['courseSchedule'][0]["endTime"])
        courseInfo.push(arr)
      }
      i++;
    }
    catch(err){
      i++;
    }
  }
}
//webscrape api
//input: Professer First name, last name, and a subject they teach (e.g., CMPT)
//output: [firstname, lastname, averageRating, [class, rating, comment] x 3]]
async function scrape(name, subject, arr)
{
  const nm = name.trim().split(/\s+/)
  for(let i = 0; i<letters.length; i++)
  {
    const url = 'https://ratemyprof-api.vercel.app/api/getProf?first=' + nm[0].toLowerCase() + '&last=' + nm[1].toLowerCase() + '&schoolCode=U2Nob29sLTE0Nj' + letters[i]
    // console.log(url)
    const { data } = await axios.get(url);
    try
    {
      if(data['ratings'][i]['class'].includes(subject))
      {
        arr.push(data['firstName'], data['lastName'], data['avgRating'])
        var review1 = [data['ratings'][0]['class'], data['ratings'][0]['clarityRating'], data['ratings'][0]['comment']]
        var review2 = [data['ratings'][1]['class'], data['ratings'][0]['clarityRating'], data['ratings'][1]['comment']]
        var review3 = [data['ratings'][2]['class'], data['ratings'][0]['clarityRating'], data['ratings'][2]['comment']]
        arr.push(review1, review2, review3)
        // console.log(data['firstName'] + " " + data['lastName'] + " " + data['avgRating'])
        // console.log("Rating 1 for " + data['ratings'][0]['class'] + ": " + data['ratings'][0]['clarityRating'])
        // console.log("Comment: " + data['ratings'][0]['comment'])
        // console.log("Rating 2 for " + data['ratings'][1]['class'] + ": " + data['ratings'][0]['clarityRating'])
        // console.log("Comment: " + data['ratings'][1]['comment'])
        // console.log("Rating 3 for " + data['ratings'][2]['class'] + ": " + data['ratings'][0]['clarityRating'])
        // console.log("Comment: " + data['ratings'][2]['comment'])
        {break;}
      }
    }
    catch(err){
    }
  }
}
function hasNumber(string)
{
  return /\d/.test(string)
}