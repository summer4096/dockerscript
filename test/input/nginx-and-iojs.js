from('debian', 'wheezy')

comment`
  Comment goes here.
    Whitespace is intelligently preserved.
  This is nifty.
`

env({
  NGINX_VERSION: '1.7.11-1~wheezy',
  IOJS_VERSION: '1.6.2'
})

include('./nginx')
include('./iojs')

comment('cleanup')
run('rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*')

run('useradd -ms /bin/bash static')

add('.', '/home/static/data')

workdir('/home/static/data')
run`
  /iojs/bin/npm install
  /iojs/bin/npm run build
`

expose(80, 443)

cmd('nginx', '-c', '/home/static/nginx/nginx.conf')