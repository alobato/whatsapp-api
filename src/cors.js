export function cors(_, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', '*')
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Authorization,user-agent')
  res.setHeader('Access-Control-Allow-Credentials', true)
  next()
}
