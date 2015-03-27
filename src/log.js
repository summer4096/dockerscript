var fs = require('fs')

module.exports = constructor
module.exports.stdout = constructor(process.stdout)
module.exports.stderr = constructor(process.stderr)

function log(output, strings, ...values){
  for (var i = 0; i < strings.length || i < values.length; i++) {
    var str = strings[i]
    var value = values[i]

    if (typeof str !== 'undefined') {
      str = str
        .replace(/\n[\t ]+/g, '\n')
        .replace(/^\n/, '')
        .replace(/\n$/, '')
      output.write(str)
    }

    if (typeof value !== 'undefined') {
      output.write(value)
    }
  }

  output.write('\n')
}

function constructor(output){
  var obj = log.bind(null, output)

  obj.raw = function(data){
    output.write(data)
  }

  return obj
}

function fromFile(path, enc){
  return constructor(fs.createWriteStream(path, enc))
}