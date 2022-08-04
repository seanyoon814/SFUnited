var chai = require("chai")
const request = chai.request
const expect = chai.expect
var chaiHttp = require("chai-http")
var servera = require("../index")
var server = servera.app;
var flr = servera.method
var mocha = require("mocha")
var should = chai.should()
var par = require('node-html-parser')
const { JSDOM } = require('jsdom');
chai.use(require('chai-dom'));
const session = require('express-session')
const express = require('express')
;
chai.use(chaiHttp)
const { Pool } = require('pg');
var pool;
pool = new Pool({
  // string that connects you to the database
  // scheme:userthatisnamedpostgres:password for postgress@localhost on pc/the database named users
  connectionString: 'postgres://postgres:elchapo0814@localhost/users'
})

var mockApp = express();
mockApp.use(session({
    name: 'session',
    secret: 'zordon',
    resave: false,
    saveUninitialized: false,
    maxAge: 30 * 60 * 1000  // 30 minutes
  }))
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

    it('should POST class onto schedule page given correct course', (done) => {
        chai.request(server)
        
            .post("/schedule")
            .send({fcourse:'Stat 270'})
            .redirects(0)
            .end((err, res) => {
                res.should.have.status(302);
                res.should.redirectTo("/schedule");
                done();
            })
    })



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
    it('should search on POST', (done) => {
        chai.request(server)
        .post('/searchclub')
        .send({clubs:'Finance Club - SFU'})
        .redirects(0)
        .end((err, res) => {
            res.should.have.status(302);
            done();
        })
    })
    it('should filter on POST', (done) => {
        chai.request(server)
        .post('/filter')
        .send({clubs:'F'})
        .redirects(0)
        .end((err, res) => {
            res.should.have.status(302);
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
describe('maps', async () => {
    it('restaurants should sort by rating', async () => {
        chai.request(server)
        .post('/addrestaurant')
        .send({user: 'sean0814', fname:'A&W'})
        .redirects(0)
        .end(async (err, res) => {
            const arr = await servera.qsRating()
            arr[0]['rating'].should.be.eql(1)
            arr[1]['rating'].should.be.eql(2)
            arr[2]['rating'].should.be.eql(3)
            res.should.have.status(302);
            res.should.redirectTo("/maps")
        })
    })
    it('restaurants should sort by price', async () => {
        chai.request(server)
        .post('/addrestaurant')
        .send({user: 'sean0814', fname:'A&W'})
        .redirects(0)
        .end(async (err, res) => {
            const arr = await servera.qsPrice()
            arr[0]['price'].should.be.eql(1)
            arr[1]['price'].should.be.eql(10)
            arr[2]['price'].should.be.eql(100)
            res.should.have.status(302);
            res.should.redirectTo("/maps")
        })
    })
    it('should POST new restaurant', (done) => {
        chai.request(server)
        .post('/addrestaurant')
        .send({user: 'sean0814', fname:'A&W'})
        .redirects(0)
        .end((err, res) => {
            res.should.have.status(302);
            res.should.redirectTo("/maps")
            done();
        })
    })
    it('should DELETE restaurant', (done) => {
        var count;
        var count1;
        pool.query('SELECT * FROM rest', (error, response)=>{
            count = response.rows.length
        })
        chai.request(server)
        .post('/removerestaurant')
        .send({rest: 'A&W'})
        .redirects(0)
        .end((err, res) => {
            pool.query('SELECT * FROM rest', (error, response)=>{
                count1 = response.rows.length
            })
            res.should.have.status(302);
            res.should.redirectTo("/maps")
            done();
        })
    })
    it('should change radius', async () => {
        //find local restaurant function call
        const fl = await flr()
        fl.should.be.eql('https://maps.googleapis.com/maps/api/place/textsearch/json?query=restaurants&location=49.2781,-122.9199&radius=400&key=AIzaSyA_BT-GrVANBYP-iZo_dmM6kYx6pEkQ3Bk')
    }).timeout(10000);
    it('should change campus on GET', (done) => {
        chai.request(server)
        .get('/maps')
        .redirects(0)
        .end((err, res) => {
            //changing to surrey
            res.should.have.status(302);
            done();
        })
    })
})
