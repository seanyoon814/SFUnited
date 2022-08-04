// const { spawn } = require('child_process');
// const got = require('got');
// const test = require('tape');

// // Start the app
// const env = Object.assign({}, process.env, {PORT: 5000});
// const child = spawn('node', ['index.js'], {env});

// test('responds to requests', (t) => {
//   t.plan(4);

//   // Wait until the server is ready
//   child.stdout.on('data', _ => {
//     // Make a request to our app
//     (async () => {
//       const response = await got('http://127.0.0.1:5000');
//       // stop the server
//       child.kill();
//       // No error
//       t.false(response.error);
//       // Successful response
//       t.equal(response.statusCode, 200);
//       // Assert content checks
//       t.notEqual(response.body.indexOf("<title>Node.js Getting Started on Heroku</title>"), -1);
//       t.notEqual(response.body.indexOf("Getting Started on Heroku with Node.js"), -1);
//     })();
//   });
// });
var chai = require("chai")
const request = chai.request
const expect = chai.expect
var chaiHttp = require("chai-http")
var server = require("../index")
var mocha = require("mocha")
var should = chai.should()

chai.use(chaiHttp)

const { Pool } = require('pg');
var pool;
pool = new Pool({
  // string that connects you to the database
  // scheme:userthatisnamedpostgres:password for postgress@localhost on pc/the database named users
  connectionString: 'postgres://postgres:carverbaddies@localhost/users'
})


describe('StudentScheduleNewClass', () => {
    //ensure login page is seen
    it('should GET login page', (done) => {
        chai.request(server)
            .get("/")
            .end((err, res) => {
                res.should.have.status(200);
                res.should.to.be.html;
                done();
            })
    })

    //302 would be redirected aka not logged in
    it('should GET dashboard page after login', (done) => {
        chai.request(server)
            .get("/dashboard")
            .end((err, res) => {
                res.should.have.status(200);
                res.should.to.be.html;
                done();
            })
    })

    it('should GET schedule page after login', (done) => {
        chai.request(server)
            .get("/schedule")
            .end((err, res) => {
                res.should.have.status(200);
                res.should.to.be.html;
                done();
            })
    })

    it('should POST class onto schedule page given correct course', function(done) {
        chai.request(server)
        
            .post("/schedule")
            .send({fcourse:'Stat 270'})
            .redirects(0)
            .end(function(err, res) {
                res.should.have.status(302);
               // res.body.should.be.a('array');
                res.body.course.should.equal('Stat 270');
                res.should.redirectTo("/schedule");
                done();
            });
    });



    it('should not POST class onto page given wrong course', (done) => {
        chai.request(server)
        
            .post("/schedule")
            .send({fcourse:'abcd'})
            .redirects(0)
            .end((err, res) => {
                //change to the new redirect
                res.should.have.status(302);
                res.should.redirectTo("/schedule");
                done();
            })
    })



    //doesn't actually do shit
    it('should POST class onto schedule when no conflicts', (done) => {
        chai.request(server)
            .post("/enroll")
            .send({
                'fname': 'MACM 101 D100',
                'fcampus': 'Burnaby',
                'fprofessor': 'Andrei Bulatov',
                'fdays': 'Mo,We,Fr',
                'fstart': '11:30',
                'fend': '12:20'
            })
            .redirects(0)
            .end((err, res) => {
                //change to the new redirect
                res.should.have.status(302);
                res.should.redirectTo("/schedule");
                done();
            })
    })

    it('should not POST class onto schedule when conflicts', (done) => {
        chai.request(server)
            .post("/enroll")
            .send({
                'fname': 'CMPT 120 D100',
                'fcampus': 'Burnaby',
                'fprofessor': 'Angelica Lim',
                'fdays': 'Mo,We,Fr',
                'fstart': '9:30',
                'fend': '10:20'
            , })
            .send({
                'fname': 'STAT 270 D100',
                'fcampus': 'Burnaby',
                'fprofessor': 'Sonja Isberg',
                'fdays': 'Mo,We,Fr',
                'fstart': '9:30',
                'fend': '10:20'
            })
            .redirects(0)
            .end((err, res) => {
                res.should.redirectTo("/schedule");
                done();
            })
    })
})



describe('FindingProfessorName', () => {

    it('should GET login page', (done) => {
        chai.request(server)
            .get("/")
            .end((err, res) => {
                res.should.have.status(200);
                res.should.to.be.html;
                done();
            })
    })

    it('should GET schedule page after login', (done) => {
        chai.request(server)
            .get("/schedule")
            .end((err, res) => {
                res.should.have.status(200);
                res.should.to.be.html;
                done();
            })
    })

    it('should POST prof name if real person and valid course', (done) => {
        chai.request(server)
        
            .post("/schedule")
            .send({fname:'Bobby Chan', subj:'CMPT 128'})
            .redirects(0)
            .end((err, res) => {
                res.should.have.status(302);
                res.should.redirectTo("/schedule");
                done();
            })
    })

    it('should POST prof name if real person', (done) => {
        chai.request(server)
        
            .post("/schedule")
            .send({fname:'Bobby Chan'})
            .redirects(0)
            .end((err, res) => {
                res.should.have.status(302);
                res.should.redirectTo("/schedule");
                done();
            })
    })

    it('should not POST prof name if only course is given', (done) => {
        chai.request(server)
        
            .post("/schedule")
            .send({subj:'asdfa'})
            .redirects(0)
            .end((err, res) => {
                res.should.have.status(302);
                res.should.redirect;
                done();
            })
    })

})

describe('StudentDroppingCourse', () => {

    it('should GET login page', (done) => {
        chai.request(server)
            .get("/")
            .end((err, res) => {
                res.should.have.status(200);
                res.should.to.be.html;
                done();
            })
    })


    it('should GET schedule page after login', (done) => {
        chai.request(server)
            .get("/schedule")
            .end((err, res) => {
                res.should.have.status(200);
                res.should.to.be.html;
                done();
            })
    })

    it('should POST remove classes that only the student has', (done) => {
        chai.request(server)
            .post("/delete")
            .send({fcourse: 'CMPT 120'})
            .redirects(0)
            .end((err, res) => {
                res.should.redirectTo("/schedule");
                done();
            })
    })

    it('should not POST remove classes that the student does not have', (done) => {
        chai.request(server)
            .post("/delete")
            .send({fcourse: 'asdfasdf'})
            .redirects(0)
            .end((err, res) => {
                res.should.redirectTo("/schedule");
                done();
            })
    })

})


describe('groups', (ui)=>{
    it('clubs should contain name, description and link',(done)=>{
        chai.request(server).get('/groups').end(function(error,res){
            res.should.to.be.html;
            done();
        })
    })
  })

  describe('logout', () => {
    it('should GET logout redirection', (done) => {~
        chai.request(server)
            .get("/logout")
            .redirects(0)
            .end((err,res) => {
                res.should.have.status(302);
                res.should.redirectTo("/");
                done();
            }) 
    })
  })

describe('maps', ()=>{
    it('should change the radius when user prompts', (done)=>{
        var serv = chai.request(server).post("/maps")
        serv.send({
            'fradius': '400', })
        .end((err, res) => {
            var arr = []
            res.fradius.should.equal(400)
            const result = server.findLocalRestauraunts(arr, res.fradius, "Burnaby")
            expect(result).to.include("400")
            done();
        })
    })
    it('should sort properly', (done)=>{
        var arr = server.findLocalRestauraunts(arr, res.radius, "Burnaby")
        server.quickSortPrice(arr, 0, arr.length-1)
        expect(arr).to.be.ordered
    })
})
