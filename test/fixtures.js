var assert = require('assert')
var fs = require('fs')
var concat = require('concat-stream')
var ds = require('../dist/program')

var expect = require('chai').expect

describe('Fixture', function(){
  var fixtures = fs.readdirSync(__dirname+'/input')
  fixtures.forEach(function(fixture){
    describe(fixture, function(){
      var inputFile = __dirname+'/input/'+fixture
      var outputFile = __dirname+'/output/'+fixture.replace(/\.js$/, '')

      it('should match expected output', function(done){
        ds(inputFile, concat(function(output){
          fs.readFile(outputFile, 'utf8', function(err, data){
            if (err) {
              console.log(output)
              throw err
            }

            expect(output).to.equal(data)

            done()
          })
        }))
      })
    })
  })
})