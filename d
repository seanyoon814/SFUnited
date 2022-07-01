[33mcommit cb811a1f65be8eb11f3b7bc02edfcadbaab59bfe[m[33m ([m[1;31mheroku/main[m[33m, [m[1;32mmain[m[33m)[m
Author: seanyoon814 <seanyoonn814@gmail.com>
Date:   Thu Jun 30 20:56:05 2022 -0700

    added postgreSQL database onto server

[1mdiff --git a/index.js b/index.js[m
[1mindex b6eaaa7..2880d4c 100644[m
[1m--- a/index.js[m
[1m+++ b/index.js[m
[36m@@ -5,11 +5,15 @@[m [mconst path = require('path')[m
 const PORT = process.env.PORT || 5000[m
 const { Pool } = require('pg');[m
 const { query } = require('express')[m
[32m+[m[32mconst { resolve } = require('path')[m
 var pool;[m
[31m-pool = new Pool([m
[31m-  {[m
[31m-    [m
[31m-  })[m
[32m+[m[32mpool = new Pool({[m
[32m+[m[32m  connectionString: process.env.DATABASE_URL,[m[41m [m
[32m+[m[32m  ssl: {[m
[32m+[m[32m      rejectUnauthorized: false[m
[32m+[m[32m    }[m
[32m+[m[32m})[m
[32m+[m
 var letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'][m
 async function scrape(firstName, lastName, subject)[m
 {[m
[36m@@ -63,24 +67,31 @@[m [mapp.listen(PORT, () => console.log(`Listening on ${ PORT }`))[m
 app.get('/login', (req, res)=>{[m
   res.render('pages/login')[m
 })[m
[31m-async function checkUsers(name, password)[m
[32m+[m
[32m+[m[32mfunction checkUsers(name, password)[m
 {[m
[31m-  var getUsersQuery = `SELECT * FROM usr`;[m
[31m-  pool.query(getUsersQuery, (error, result)=>{[m
[31m-    if(error)[m
[31m-      res.send(error);[m
[31m-    var results = {'rows':result.rows}[m
[31m-    for(var i = 0; i<results.rows.length; i++)[m
[31m-    {[m
[31m-      var r1 = results['rows'][i]['fname'].toString()[m
[31m-      var r2 = results['rows'][i]['fpassword'].toString()[m
[31m-      if(r1.trim() == name.trim())[m
[31m-      {[m
[31m-        console.log("Ran")[m
[31m-        return 1;[m
[31m-      }[m
[31m-    }[m
[31m-    return 0;[m
[32m+[m[32m  return new Promise((resolve, reject)=>[m
[32m+[m[32m  {[m
[32m+[m[32m    var getUsersQuery = `SELECT * FROM usr`;[m
[32m+[m[32m    setTimeout(() => {[m
[32m+[m[32m      pool.query(getUsersQuery, (error, result)=>{[m
[32m+[m[32m        if(error)[m
[32m+[m[32m          res.send(error);[m
[32m+[m[32m        var results = {'rows':result.rows}[m
[32m+[m[32m        for(var i = 0; i<results.rows.length; i++)[m
[32m+[m[32m        {[m
[32m+[m[32m          var r1 = results['rows'][i]['fname'].toString()[m
[32m+[m[32m          var r2 = results['rows'][i]['fpassword'].toString()[m
[32m+[m[32m          if(r1.trim() == name.trim() && r2.trim() == password.trim())[m
[32m+[m[32m          {[m
[32m+[m[32m            console.log("Ran")[m
[32m+[m[32m            resolve(1);[m
[32m+[m[32m            return 1;[m
[32m+[m[32m          }[m
[32m+[m[32m        }[m
[32m+[m[32m        resolve(0);[m
[32m+[m[32m        return 0;[m
[32m+[m[32m    }, 100)})[m
   })[m
 }[m
 app.post('/', async (req,res)=> {[m
[36m@@ -90,11 +101,9 @@[m [mapp.post('/', async (req,res)=> {[m
   // INSERT INTO usr (fname, fpassword)[m
   // VALUES ('${un}', '${pwd}')[m
   // `;[m
[31m-  var bool = await checkUsers(un, pwd)[m
[31m-  console.log(bool)[m
[32m+[m[32m  const bool = await checkUsers(un, pwd)[m
   if(Number(bool) == 1)[m
   {[m
[31m-    console.log("Ran here")[m
     req.session.user = req.body[m
     res.redirect('/dashboard')[m
   }[m
