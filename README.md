# dockerscript
Write your Dockerfile in javascript!

[![Build Status](https://travis-ci.org/summer4096/dockerscript.svg?branch=master)](https://travis-ci.org/summer4096/dockerscript)

## Install

```console
npm install -g dockerscript
```

## Example dockerfile.js

```javascript
from('debian', 'wheezy')

maintainer('you', 'your@email.com')

env('NGINX_VERSION', '1.7.11-1~wheezy')

run`
  apt-key adv --keyserver pgp.mit.edu --recv-keys 573BFD6B3D8FBC641079A6ABABF5BD827BD9BF62 &&
  echo "deb http://nginx.org/packages/mainline/debian/ wheezy nginx" >> /etc/apt/sources.list &&
  apt-get update &&
  apt-get install -y ca-certificates nginx=$NGINX_VERSION &&
  rm -rf /var/lib/apt/lists/*
`

comment('forward request and error logs to docker log collector')

run`
  ln -sf /dev/stdout /var/log/nginx/access.log &&
  ln -sf /dev/stderr /var/log/nginx/error.log
`

volume('/var/cache/nginx')

expose(80, 443)

cmd("nginx", "-g", "daemon off;")
```

this turns into:

```Dockerfile
FROM debian:wheezy

MAINTAINER you <your@email.com>

ENV NGINX_VERSION=1.7.11-1~wheezy

RUN apt-key adv --keyserver pgp.mit.edu --recv-keys 573BFD6B3D8FBC641079A6ABABF5BD827BD9BF62 && \
    echo "deb http://nginx.org/packages/mainline/debian/ wheezy nginx" >> /etc/apt/sources.list && \
    apt-get update && \
    apt-get install -y ca-certificates nginx=$NGINX_VERSION && \
    rm -rf /var/lib/apt/lists/*

# forward request and error logs to docker log collector
RUN ln -sf /dev/stdout /var/log/nginx/access.log && \
    ln -sf /dev/stderr /var/log/nginx/error.log

VOLUME /var/cache/nginx

EXPOSE 80 443

CMD ["nginx","-g","daemon off;"]
```

## Usage

Run the `dockerscript` command or use the `ds` alias.

With no arguments, it looks for a `dockerfile.js` in the current directory and writes to `Dockerfile` in the current directory.

Your script will be passed through [babel](https://babeljs.io/) so you're free to use es6.

```console
#Simple usage:
$ ls
dockerfile.js
$ ds
$ ls
Dockerfile  dockerfile.js

#If you want to write to a different file, do this:
$ ds mydockerfile.js Dockerfile

#If you want to write to stdout, do this:
$ ds -
FROM ubuntu
...

#If you want to keep error logs, do this:
$ ds input.js Dockerfile.test dockerscript_errors.log
```

## Globals

The following global functions are available to your dockerscript files:

### [from(name, [tag])](https://docs.docker.com/reference/builder/#from)

### [maintainer(name, [email])](https://docs.docker.com/reference/builder/#maintainer)

### [run(...commands)](https://docs.docker.com/reference/builder/#run)

You can use `run` five different ways:

```javascript
run('ls '+dir)
run('ls -l '+dir)
run('ls', '-l', dir)
run(['ls', '-l', dir])
run`ls -l ${dir}`
```

Using template tags you can easily pass in multiple lines. The linebreaks will be escaped for you.

```javascript
run`
  ls -l ${dir} &&
  touch ${dir}/somethingElse
`
```

### [cmd(...commands)](https://docs.docker.com/reference/builder/#cmd)

You can use `cmd` in all of the same ways that you can use `run`

### [expose(...ports)](https://docs.docker.com/reference/builder/#expose)

You can specify one port, or multiple.

```javascript
expose(80)
expose(80, 443)
```

### [env(key, value)](https://docs.docker.com/reference/builder/#env)

You can use `env` two ways:

```javascript
env('NODE_VERSION', '0.12.0')
env({
  NODE_VERSION: '0.12.0',
  NPM_VERSION: '2.5.1'
})
```

### [add(src..., dest)](https://docs.docker.com/reference/builder/#add)

Don't worry about path whitespace, I got this.

### [copy(src..., dest)](https://docs.docker.com/reference/builder/#copy)

Don't worry about path whitespace, I got this.

### [entrypoint(...commands)](https://docs.docker.com/reference/builder/#entrypoint)

Works just like `run` and `cmd`.

### [volume(...volumes)](https://docs.docker.com/reference/builder/#volume)

Specify one or more.

### [user(username)](https://docs.docker.com/reference/builder/#user)

### [onbuild(callback)](https://docs.docker.com/reference/builder/#onbuild)

Use it like this:

```javascript
onbuild(function(){
  run('echo', 'done building!')
})
```

The callback function will *not* be called on build, it's just for structure.

Docker doesn't allow multiple onbuild commands, so if you put more than one thing in here it won't work.

### include(path)

Grab a partial dockerscript file and include it. You can use this to break up your dockerfiles into manageable and reusable chunks.

Like require, the path is relative to the currently executing script. Unlike require, it does not return any exports. It's just for partials.

## Why?

 - it's cool
 - it's trendy
 - it's turing complete
 - it lets you do some fun things

```javascript
if (process.env.DOCKER_ENV == 'production') {
  include('./monitoring')
  add('./www', '/var/www')
} else if (process.env.DOCKER_ENV == 'development') {
  include('./debugger')
  volume('/var/www')
}
```

## Contributing

Contributors will be rewarded with a lifetime supply of imaginary pizza. :pizza: :pizza: :pizza:

If you send me a pull request that's good, I'll probably merge it.

Please follow some simple guidelines:

 - Run tests with `npm test`
 - Write tests and put them in the `test` directory.
 - Don't be a jerk to anybody

If you need help with any of these things, let me know and I'll do my best to help you out.