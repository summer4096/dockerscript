var fs = require('fs')
var path = require('path')
var dockerfile = require('../')
var log = require('./log').stdout

module.exports = function(...args){
  var input = './dockerfile.js'
  var output = './Dockerfile'
  var error = '-'

  function help(){
    log`
      You can run dockerfile.js with up to 3 arguments

      dockerfile.js output
      dockerfile.js input output
      dockerfile.js input output error
      
      defaults:
      input    ${input}
      output   ${output} (use - for stdout)
      error    ${error} (use - for stderr)
    `
    process.exit()
  }

  if (args[0] === '--help') {
    help()
  } else if (args.length === 1) {
    output = args[0]
  } else if (args.length === 2) {
    input = args[0]
    output = args[1]
  } else if (args.length === 3) {
    input = args[0]
    output = args[1]
    err = args[2]
  } else {
    help()
  }

  if (output === '-') {
    output = process.stdout
  } else if (typeof output === 'string') {
    output = fs.createWriteStream(output)
  } else if (typeof output.pipe !== 'function') {
    throw new Error('I don\'t know what to do with this output: '+output)
  }

  if (error === '-') {
    error = process.stderr
  } else if (typeof error === 'string') {
    error = fs.createWriteStream(error)
  } else if (typeof error.pipe !== 'function') {
    throw new Error('I don\'t know what to do with this error: '+error)
  }

  var globals = dockerfile(output, error)

  for (var cmd in globals) {
    if (cmd !== '__end') {
      global[cmd] = globals[cmd]
    }
  }

  if (input[0] !== '/') {
    input = path.join(process.cwd(), input)
  }

  globals.include(input)

  globals.__end()
}