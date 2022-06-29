const express = require('express')
const axios = require('axios')
const cheerio = require('cheerio')
const fs = require('fs')
const path = require('path')
const PORT = process.env.PORT || 5000
const { Pool } = require('pg');
var pool;

var letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']
async function scrape()
{
  console.log("Ran")
  for(let i = 0; i<letters.length; i++)
  {
    const url = 'https://ratemyprof-api.vercel.app/api/getProf?first=bobby&last=chan&schoolCode=U2Nob29sLTE0Nj' + letters[i]
    const { data } = await axios.get(url);
    try{
      if(data['ratings'][0]['class'].includes("CMPT"))
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
app.use(express.json());
app.use(express.urlencoded({extended:false}))
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => res.render('pages/index'))
app.listen(PORT, () => console.log(`Listening on ${ PORT }`))

app.get('/login', (req, res)=>{
  scrape();
  res.render('pages/login')
})

app.get('/schedule', (req, res)=>{
  res.render('pages/schedule')
})

