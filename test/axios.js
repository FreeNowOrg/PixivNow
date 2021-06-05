const { default: axios } = require('axios')

axios.get('https://baidu.com').then(({ headers }) => console.log(headers))
