module.exports.isLoggedIn = (req, res, next) => {
  console.log('user req', req.user)
  if (!req.isAuthenticated()){
    req.flash('error', 'You must singed in')
    return res.redirect('/login')
  }
  next();
}