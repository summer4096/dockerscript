comment('nginx key')
run('apt-key adv --keyserver pgp.mit.edu --recv-keys 573BFD6B3D8FBC641079A6ABABF5BD827BD9BF62')
run('echo "deb http://nginx.org/packages/mainline/debian/ wheezy nginx" >> /etc/apt/sources.list')

comment('nginx installation')
run('apt-get update')
run('apt-get install -y ca-certificates curl nginx=${NGINX_VERSION}')

comment('forward logs')
run`
  ln -sf /dev/stdout /var/log/nginx/access.log &&
  ln -sf /dev/stderr /var/log/nginx/error.log
`