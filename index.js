const express = require('express')
const cors = require('cors')
const axios = require('axios')
const session = require('express-session')
const path = require('path')
const PORT = process.env.PORT || 5000
const { Pool } = require('pg');
const { query } = require('express')
const { resolve } = require('path')
const request = require('request-promise')
const cheerio = require('cheerio')
const {Client} = require("@googlemaps/google-maps-services-js");
var pool;
const client = new Client({});
pool = new Pool({
  connectionString: process.env.DATABASE_URL, 
  ssl: {
      rejectUnauthorized: false
    }
})
var letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O',
'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']
var app = express()
var isAdmin = 0;
var user;
var recentProf = []
var recentClass = []
var enrolled = []
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

app.get('/schedule', async(req, res)=>{
  if (req.session.user)
  {
    var queryString = `SELECT * FROM classes where username='${user}'`;
    pool.query(queryString, (error, result)=>{
      if(error)
      {
        res.send(error)
      }
      var enroll = {'rows':result.rows}
      enrolled = enroll
      var results = recentProf
      var classes = recentClass
      res.render('pages/schedule', {results:results, classes:classes, enrolled:enrolled.rows})
    })
  }
  else
  {
    res.redirect('/')
  }
})
app.post('/schedule', async (req, res)=>{
  var course = req.body.fcourse
  var firstName = req.body.fname
  var subj = req.body.subj
  if(firstName!=null && subj!=null)
  {
    var results = []
    await scrape(firstName, subj, results)
    recentProf = results
    res.redirect('/schedule')
    return 0;
  }
  else if(course)
  {
    var classes = []
    await getCourseInformation(course, classes)
    recentClass = classes
    res.redirect('/schedule')
    return 0;
  }
  else
  {
    res.redirect('/schedule')
  }
})

app.post('/enroll', async (req, res)=>{
  var username = user
  var course = req.body.fname.trim()
  var location = req.body.fcampus
  var prof = req.body.fprofessor
  var days = req.body.fdays
  var start = req.body.fstart
  var end = req.body.fend
  var queryString = `
  INSERT INTO classes (username, course, section, location, professor, days, startt, endt)
  VALUES ('${username}', '${course}', '${course}', '${location}', '${prof}', '${days}', '${start}', '${end}')
  `;
  var bool = await checkConflictingTime(start, end, days)
  if(bool == 1)
  {
    pool.query(queryString, (error, result)=>{
      if(error)
      {
        res.send(error)
        return 0;
      }
      recentClass = []
      res.redirect("/schedule")
    })
  }
  else
  {
    res.redirect('/schedule')
  }
})

app.post('/delete', (req, res)=>{
  var course = req.body.fcourse
  course.trim()
  var queryString = `
  DELETE FROM classes
  WHERE course='${course}'`;
  pool.query(queryString, (error, result)=>{
    if(error)
    {
      res.send(error)
      return 0;
    }
    res.redirect("/schedule")
  })
})

app.get('/groups',async (req,res)=>{
  if (req.session.user)
  {
    clubScrape(function(clubs){
      res.render('pages/groups', {clubs:clubs})
    })

  }
  else
  {
    res.redirect('/')
  }
})

app.post('/schedule', async (req, res)=>{
  var course = req.body.fcourse
  var firstName = req.body.fname
  var subj = req.body.subj
  if(firstName!=null && subj!=null)
  {
    var results = []
    await scrape(firstName, subj, results)
    recentProf = results
    res.redirect('/schedule')
    return 0;
  }
  else if(course)
  {
    var classes = []
    await getCourseInformation(course, classes)
    if(classes.length>0)
    {
      recentClass = classes
      res.redirect('/schedule')
      return 0;
    }
    else
    {
      res.redirect('/schedule')
    }
  }
  else
  {
    res.redirect('/schedule')
  }
})

app.post('/delete', (req, res)=>{
  var course = req.body.fcourse
  course.trim()
  var queryString = `
  DELETE FROM classes
  WHERE course='${course}'`;
  pool.query(queryString, (error, result)=>{
    if(error)
    {
      res.send(error)
      return 0;
    }
    res.redirect("/schedule")
  })
})
app.get('/maps', (req, res)=>{
  res.render('pages/maps')
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
  const courseNumbers = formattedStr.slice(index, formattedStr.length);
  var url = 'https://www.sfu.ca/bin/wcm/course-outlines?2022/fall/' + courseLetters + '/' + courseNumbers + '/'
  var valid = 0;
  try
  {
    var {data} = await axios.get(url)
  }
  catch
  {
    valid = 1
  }
  let i = 0;
  //variable to print the information of the course only once
  let hasRan = 0;
  if(valid == 0)
  {
    while(i<data.length)
    {
      const sectionurl = url + data[i]['value']
      try{
        const sectionData = await axios.get(sectionurl)
        if(hasRan == 0)
        {
          courseInfo.push({
            desc: sectionData['data']['info']['description'],
            prereq: sectionData['data']['info']['prerequisites'],
            notes: sectionData['data']['info']['notes']
          })
          // courseInfo.push(sectionData['data']['info']['description'], sectionData['data']['info']['prerequisites'], sectionData['data']['info']['notes'])
          hasRan = 1
        }
        if(sectionData['data']['courseSchedule'][0]["sectionCode"]=="LEC")
        { 
          try{
              courseInfo.push({
              name: sectionData['data']['info']['name'],
              term: sectionData['data']['info']['term'],
              prof: sectionData['data']['instructor'][0]['name'],
              campus: sectionData['data']['courseSchedule'][0]["campus"],
              room: sectionData['data']['courseSchedule'][0]["buildingCode"],
              roomNum: sectionData['data']['courseSchedule'][0]["roomNumber"],
              days: sectionData['data']['courseSchedule'][0]["days"] + ", " + sectionData['data']['courseSchedule'][1]["days"],
              start: sectionData['data']['courseSchedule'][0]["startTime"] + "," + sectionData['data']['courseSchedule'][1]["startTime"],
              end: sectionData['data']['courseSchedule'][0]["endTime"] + "," + sectionData['data']['courseSchedule'][1]["endTime"],
            })
          }
          catch(err)
          {
            courseInfo.push({
              name: sectionData['data']['info']['name'],
              term: sectionData['data']['info']['term'],
              prof: sectionData['data']['instructor'][0]['name'],
              campus: sectionData['data']['courseSchedule'][0]["campus"],
              room: sectionData['data']['courseSchedule'][0]["buildingCode"],
              roomNum: sectionData['data']['courseSchedule'][0]["roomNumber"],
              days: sectionData['data']['courseSchedule'][0]["days"],
              start: sectionData['data']['courseSchedule'][0]["startTime"],
              end: sectionData['data']['courseSchedule'][0]["endTime"]
            })
          }
          // arr.push(sectionData['data']['info']['name'], sectionData['data']['info']['term'], sectionData['data']['instructor'][0]['name'], sectionData['data']['courseSchedule'][0]["campus"],
          // sectionData['data']['courseSchedule'][0]["buildingCode"], sectionData['data']['courseSchedule'][0]["roomNumber"], sectionData['data']['courseSchedule'][0]["days"], sectionData['data']['courseSchedule'][0]["startTime"], sectionData['data']['courseSchedule'][0]["endTime"])
          // courseInfo.push(arr)
        }
        i++;
      }
      catch(err){
        i++;
      }
    }
  }
}
//webscrape api
//input: Professer First name, last name, and a subject they teach (e.g., CMPT)
//output: [firstname, lastname, averageRating, [class, rating, comment] x 3]]
async function scrape(name, subject, arr)
{
  if(name.length>0 && subject.length>0 && !hasNumber(name) && !hasNumber(subject) && name.includes(" "))
  {
    const nm = name.trim().split(/\s+/)
    for(let i = 0; i<letters.length; i++)
    {
      const url = 'https://ratemyprof-api.vercel.app/api/getProf?first=' + nm[0].toLowerCase() + '&last=' + nm[1].toLowerCase() + '&schoolCode=U2Nob29sLTE0Nj' + letters[i]
      const { data } = await axios.get(url);
      try
      {
        if(data['ratings'][i]['class'].includes(subject.toUpperCase()))
        {
          arr.push({
            fname: data['firstName'],
            lname: data['lastName'],
            r: data['avgRating']
          })
          arr.push({
            class: data['ratings'][0]['class'],
            rating: data['ratings'][0]['clarityRating'],
            comment: data['ratings'][0]['comment'],
            grade: data['ratings'][0]['grade']
          })
          arr.push({
            class: data['ratings'][1]['class'],
            rating: data['ratings'][1]['clarityRating'],
            comment: data['ratings'][1]['comment'],
            grade: data['ratings'][1]['grade']
          })
          arr.push({
            class: data['ratings'][2]['class'],
            rating: data['ratings'][2]['clarityRating'],
            comment: data['ratings'][2]['comment'],
            grade: data['ratings'][2]['grade']
          })
          {break;}
        }
      }
      catch(err){
      }
    }
  }
}

//webscraper for Clubs npm install cheerio, request-promise
async function clubScrape(callback)
{
  clubs = []
  request("https://go.sfss.ca/clubs/list", (error,response,html)=>{
  if(!error && response.statusCode ==200){
      const $= cheerio.load(html);
      $("b").each((i,data)=>{
            club = {name:"", desc:"", link:""};
            const name = $(data).text();
            const link = $(data).find('a').attr('href');
            club.name = name;
            club.link = link;
            if(name != '' && link != ''){
              clubs.push(club);
            }
      })

      $('b').remove();
      value = 0;
      $("td").each((num,data)=>{
          const desc = $(data).text().trim();
          if(desc != ''){
            clubs[value].desc = desc;
            value++;
          }
      })
      callback(clubs);
    }
  })
}

function checkChars(str)
{
  return /^[a-zA-Z]+$/.test(str)
}

function hasNumber(string)
{
  return /\d/.test(string)
}
//returns 1 if true, 0 if false
async function checkConflictingTime(startTime, endTime, days)
{
  return new Promise((resolve, reject)=>
  {
    var getUsersQuery = `SELECT * FROM classes where username='${user}'`;
    if(startTime.includes(","))
    {
      var time = convertTime(startTime, endTime)
      var day = days.trim().split(',')
      setTimeout(() => {
        pool.query(getUsersQuery, (error, result)=>{
          if(error)
          {
            resolve(0);
          }
          var results = {'rows':result.rows}
          for(var i = 0; i<results.rows.length; i++)
          {
            if(results['rows'][i]['startt'].includes(","))
            {
              let start = convertTime(results['rows'][i]['startt'], results['rows'][i]['endt'])
              let otherdays = results['rows'][i]['days']
              if(((time[0] >= start[0] && time[1] <=start[1]) || (time[0] <= start[0] && (time[1] >= start[0] && time[1] <= start[1])) || (time[1] >= start[1] && (time[0] >= start[0] && time[0] <=start[1])))
              || ((time[2] >= start[2] && time[3] <=start[3]) || (time[2] <= start[2] && (time[3] >= start[2] && time[3] <= start[2])) || (time[3] >= start[3] && (time[2] >= start[2] && time[2] <=start[3]))))
              {
                for(var j = 0; j<day.length; j++)
                {
                  if(otherdays.includes(day))
                  {
                    resolve(0);
                    return 0;
                  }
                }
              }
            }
            else
            {
              let start = convertTime(results['rows'][i]['startt'], results['rows'][i]['endt'])
              let otherdays = results['rows'][i]['days']
              if(((time[0] >= start[0] && time[1] <=start[1]) || (time[0] <= start[0] && (time[1] >= start[0] && time[1] <= start[1])) || (time[1] >= start[1] && (time[0] >= start[0] && time[0] <=start[1])))
              || (time[2] >= start[0] && time[3] <=start[1]) || (time[2] <= start[0] && (time[3] >= start[0] && time[3] <= start[1])) || (time[3] >= start[1] && (time[2] >= start[0] && time[2] <=start[1])))
              {
                for(var j = 0; j<day.length; j++)
                {
                  if(otherdays.includes(day))
                  {
                    resolve(0);
                    return 0;
                  }
                }
              }
            }
          }
          resolve(1);
          return 1;

        }, 100)})
    }
    else
    {
      var time = convertTime(startTime, endTime)
      var day = days.trim().split(',')
      setTimeout(() => {
        pool.query(getUsersQuery, (error, result)=>{
          if(error)
            resolve(0);
          var results = {'rows':result.rows}
          for(var i = 0; i<results.rows.length; i++)
          {
            
            if(results['rows'][i]['startt'].includes(","))
            {
              let start = convertTime(results['rows'][i]['startt'], results['rows'][i]['endt'])
              let otherdays = results['rows'][i]['days']
              if((time[0] >= start[0] && time[1] <=start[1]) || (time[0] <= start[0] && (time[1] >= start[0] && time[1] <= start[1])) || (time[1] >= start[1] && (time[0] >= start[0] && time[0] <=start[1]))
              || (time[0] >= start[2] && time[1] <=start[3]) || (time[0] <= start[2] && (time[1] >= start[2] && time[1] <= start[3])) || (time[1] >= start[3] && (time[0] >= start[2] && time[0] <=start[3])))
              {
                for(var j = 0; j<day.length; j++)
                {
                  if(otherdays.includes(day))
                  {
                    resolve(0);
                    return 0;
                  }
                }
              }
            }
            else
            {
              let start = convertTime(results['rows'][i]['startt'], results['rows'][i]['endt'])
              let otherdays = results['rows'][i]['days']
              if(((time[0] >= start[0] && time[1] <=start[1]) || (time[0] <= start[0] && (time[1] >= start[0] && time[1] <= start[1])) || (time[1] >= start[1] && (time[0] >= start[0] && time[0] <=start[1]))))
              {
                for(var j = 0; j<day.length; j++)
                {
                  if(otherdays.includes(day))
                  {
                    resolve(0);
                    return 0;
                  }
                }
              }
            }
          }
          resolve(1);
          return 1;
      }, 100)})
    }
  })
}
//returns [startTime, endTime] in minutes
function convertTime(startTime, endTime)
{
  if(startTime.includes(","))
  {
    let start = startTime.split(",")
    let end = endTime.split(",")
    let start1 = start[0].split(":")
    let start2 = start[1].split(":")
    let end1 = end[0].split(":")
    let end2 = end[1].split(":")
    var arr = []
    var s1minute = Number(start1[0])*60 + Number(start1[1])
    var s2minute = Number(start2[0])*60 + Number(start2[1])
    var e1minute = Number(end1[0])*60 + Number(end1[1])
    var e2minute = Number(end2[0])*60 + Number(end2[1])
    arr.push(s1minute, e1minute, s2minute, e2minute)
    return arr;
  }
  else
  {
    let start = startTime.split(":")
    let end = endTime.split(":")
    var arr = []
    var minute = Number(start[0])*60 + Number(start[1])
    var minute2 = Number(end[0])*60 + Number(end[1])
    arr.push(minute, minute2)
    return arr;
  }
}

function initMap() {
  // The location of Uluru
  const uluru = { lat: -25.344, lng: 131.031 };
  // The map, centered at Uluru
  const map = new google.maps.Map(document.getElementById("map"), {
    zoom: 4,
    center: uluru,
  });
  // The marker, positioned at Uluru
  const marker = new google.maps.Marker({
    position: uluru,
    map: map,
  });
}