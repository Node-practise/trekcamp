// const LocalStrategy = require('passport-local').Strategy;
// const passport = require('passport')

// app.use(passport.initialize())
// app.use(passport.session())
// passport.use(new LocalStrategy(User.authenticate()))
// // Serializer means storing to session
// passport.serializeUser(User.serializeUser())
// // de-Serializer means unstoring out of session
// passport.deserializeUser(User.deserializeUser())




// // Concerns
// // 1. suppose we have app(server in 1 file, and have large file want to reduce file size.)
// // 2. Moved some middleware changes to 2 file.
// // 3. how to pass `app`, do we require to recreate it?