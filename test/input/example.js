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