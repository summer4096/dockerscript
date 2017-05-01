var es = require('event-stream')
var shellEscape = require('shell-escape')
var concat = require('concat-stream')
var fs = require('fs')
var path = require('path')
var log = require('./log')

module.exports = function(outputStream, errorStream){
  var output = log(outputStream)
  var error = log(errorStream)

  var api = {}

  var lastCommand
  function breakSeparator(commandName){
    if (lastCommand !== commandName && lastCommand !== null && lastCommand !== '#') {
      output([])
    }
    lastCommand = commandName
  }

  function disableBreakSeparator(){
    lastCommand = null
  }

  function singleStringCommand(commandName, arg) {
    breakSeparator(commandName)

    output`${commandName} ${arg}`
  }

  function multiStringCommand(commandName, ...args) {
    breakSeparator(commandName)

    output([commandName+' '], args.join(' '))
  }

  function stringOrListCommand(commandName, exec, ...args) {
    breakSeparator(commandName)

    if (Array.isArray(args[0])) {
      //tagged template notation
      var strings = args.shift()
      var command = ''
      for (var i = 0; i < strings.length || i < args.length; i++) {
        if (typeof strings[i] !== 'undefined') {
          var str = strings[i]
          str = str.replace(/^[ \t]+/g, '')
            .replace(/^\n/, '')
            .replace(/([^ ])\n/g, '$1 \n')
            .replace(/[\s\n]+$/, '')

          if (exec) {
            var indentation = (commandName+' ').replace(/[^ ]/g, ' ')
            str = str.replace(/^\s+/, '').replace(/\n\s+/g, '\n'+indentation).replace(/\n/g, '\\\n')
          } else {
            var minimumTab = Math.min.apply(Math, str.split('\n').map(function(line){
              var whitespaceCount = 0
              for (var i = 0; i < line.length; i++) {
                if (line[i] !== ' ' && line[i] !== '\t') {
                  break
                }
                whitespaceCount++
              }
              return whitespaceCount
            }))

            str = str.split('\n').map(function(line){
              return line.substr(minimumTab)
            }).join('\n')

            str = str.replace(/\n/g, '\n'+commandName+' ')
          }
          command += str
        }

        if (typeof args[i] !== 'undefined') {
          command += exec ? shellEscape([args[i]]) : args[i].replace(/\n/g, '\n'+commandName+' ')
        }
      }

      args = [command]
    }

    if (args.length === 1) {
      args = args[0]
    } else {
      args = JSON.stringify(args)
    }

    output`${commandName} ${args}`
  }

  function keyValueCommand(commandName, key, value) {
    breakSeparator(commandName)

    if (typeof key === 'object') {
      var kv = key
      Object.keys(kv).forEach(function(key){
        keyValueCommand(commandName, key, kv[key])
      })
    } else {
      output`${commandName} ${key}=${value}`
    }
  }

  function listCommand(commandName, ...args){
    breakSeparator(commandName)

    output([commandName+' '], JSON.stringify(args))
  }

  api.from = function(image, tag){
    breakSeparator('FROM')

    output(['FROM '], image, (typeof tag !== 'undefined') ? `:${tag}` : '')
  }

  api.maintainer = function(name, email){
    breakSeparator('MAINTAINER')

    output(['MAINTAINER '], name, (typeof email === 'string') ? ` <${email}>` : '')
  }

  api.run = stringOrListCommand.bind(null, 'RUN', true)
  api.cmd = stringOrListCommand.bind(null, 'CMD', true)

  api.expose = multiStringCommand.bind(null, 'EXPOSE')

  api.env = keyValueCommand.bind(null, 'ENV')

  api.add = listCommand.bind(null, 'ADD')
  api.copy = listCommand.bind(null, 'COPY')

  api.entrypoint = stringOrListCommand.bind(null, 'ENTRYPOINT', true)

  api.volume = stringOrListCommand.bind(null, 'VOLUME', false)

  api.user = singleStringCommand.bind(null, 'USER')

  api.workdir = singleStringCommand.bind(null, 'WORKDIR')

  api.onbuild = function(callback){
    breakSeparator('ONBUILD')
    disableBreakSeparator()
    output.raw('ONBUILD ')
    callback()
    lastCommand = 'ONBUILD'
  }

  api.docker = multiStringCommand.bind(null, 'DOCKER')

  api.comment = stringOrListCommand.bind(null, '#', false)

  var workingDir = process.cwd()

  api.__end = function(){
    if (outputStream.fd !== 1 && outputStream.fd !== 2) {
      outputStream.end()
    }

    if (errorStream.fd !== 1 && errorStream.fd !== 2) {
      errorStream.end()
    }
  }

  var firstInclude = true
  api.include = function(file){
    if (firstInclude) {
      firstInclude = false
      lastCommand = null
    }

    if (file[0] !== '/') {
      file = path.join(workingDir+'/', file)
    }

    if (fs.existsSync(file)) {
      //continue...
    } else if (!file.match(/\.js$/) && fs.existsSync(file+'.js')) {
      file = file+'.js'
    } else if (fs.existsSync(file+'/package.json')) {
      var pkg = require(file+'/package.json')
      file = path.join(file+'/', pkg.main)
    } else if (fs.existsSync(file+'/index.js')) {
      file = file+'/index.js'
    } else {
      throw new Error('Can\'t find '+file)
    }

    var oldWorkingDir = workingDir
    workingDir = path.dirname(file)

    Object.assign(global, api);

    require(file);

    workingDir = oldWorkingDir
  }

  return api
}