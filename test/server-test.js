const { spawn } = require('child_process');
const got = require('got');
const test = require('tape');


var chai = require("chai")
var chaihttp = require("chai-http");
var server = require('../index');
var should = chai.should();
const expect = chai.expect

chai.use(chaihttp)

// Start the app
const env = Object.assign({}, process.env, {PORT: 5000});
const child = spawn('node', ['index.js'], {env});

test('responds to requests', (t) => {
  t.plan(4);

  // Wait until the server is ready
  child.stdout.on('data', _ => {
    // Make a request to our app
    (async () => {
      const response = await got('http://127.0.0.1:5000');
      // stop the server
      child.kill();
      // No error
      t.false(response.error);
      // Successful response
      t.equal(response.statusCode, 200);
      // Assert content checks
      t.notEqual(response.body.indexOf("<title>Node.js Getting Started on Heroku</title>"), -1);
      t.notEqual(response.body.indexOf("Getting Started on Heroku with Node.js"), -1);
    })();
  });
});

describe('groups', (ui)=>{
  it('clubs should contain name, description and link',(done)=>{
      chai.request(server).get('/groups').end(function(error,res){
        res.should.have.status(200);

        // res.body is club
        expect(res.body).to.be.an.instanceOf(Object);

        // first club in clubs should have properties
        expect(res.body)
        .to.be.an.instanceof(Object)
        .that.includes.all.keys(['name', 'desc', 'link'])

        done();
      })
  })
})