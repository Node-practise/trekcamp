if(process.env.NODE_ENV != "production"){
  require('dotenv').config();
}

const express = require('express')
const path = require('path')
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate')
const Campground = require('./model/campground')
const catchAsync = require('./utils/catchAsync')
const methodOverride = require('method-override')
const Review = require('./model/review');
const ExpressError = require('./utils/ExpressError');
const session = require('express-session')
const flash = require('connect-flash');
const passport = require('passport')
const LocalStrategy = require('passport-local')
const User = require('./model/user')
const multer = require('multer')
const {isLoggedIn} = require('./middleware')
const { storage } = require('./cloudinary');
const upload = multer({ storage })


// route list
const userRoutes = require('./routes/users');

// Connection to database START
const DB_URL = process.env.DB_URL || 'mongodb://localhost:27017/yelp-camp'
mongoose.connect(DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
const db = mongoose.connection;
db.on('error', console.error.bind(console, "Connection error:"))
db.once('open', () => {
  console.log('Databse connected')
})
// Connection to database END

const PORT = process.env.port || 3000
const app = express()
app.listen(PORT, () => console.log('Listening to port 3000'))


app.engine('ejs', ejsMate)
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

app.use(express.urlencoded({extended: true}))
app.use(methodOverride('_method'))

// configuring session with middleware
const secret = process.env.SECRET || 'thishouldbeabetterseceret!'
const sessionConfig = {
  secret: secret,
  resave: false,
  saveUninitialized: true
}
app.use(session(sessionConfig))
app.use(flash())

app.use(passport.initialize())
app.use(passport.session())
passport.use(new LocalStrategy(User.authenticate()))
// Serializer means storing to session
passport.serializeUser(User.serializeUser())
// de-Serializer means unstoring out of session
passport.deserializeUser(User.deserializeUser())



// router config-2
app.use('/', userRoutes)

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
})


// ---------
// app.route('/')
//   .post(upload.single('image'), (req, res) =>{
//     console.log(req.body, req.files);
//     res.send('It worked!')
//   })

app.get('/register', (req, res) =>{
  res.render('users/register')
})

app.post('/adduser', async (req, res) => {
  try{
  const {username, email, password} = req.body;
  const user = new User({email: email, username: username})
  const newUser = await User.register(user, password)
  req.login(newUser, err => {
    if(err) return next(err);
    req.flash('success', 'Welcome to yelpcamp!')
    res.redirect('/campgrounds');
  })
}catch(e){
  req.flash('error', e.message)
  res.redirect('/login')
  }
})

// login form
app.get('/login', (req, res) => {
  res.render('users/login')
})

// Note: -------- Need to verify and understand in details about how this middleware working automatically.

// passport.use(new LocalStrategy(
//   async function(username, password, done) {
//     // console.log(username)
//     // console.log(password)
//     // console.log(await User.findOne({username: username}))
    
//     User.findOne({ username: username }, function (err, user) {
//       console.log('userDetail: '+user)
//       if (err) { return done(err); }
//       if (!user) { return done(null, false); }
//       return done(null, user);
//     });
//   }
// ));
// --------

// get loggedInx
app.post('/loggedin', passport.authenticate('local', {failureFlash: true, failureRedirect: '/login'}), (req, res) => {
  console.log('trying to login...')
  req.flash('success', 'Welcome Back!')
  res.redirect('/campgrounds')
})

app.get('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    req.flash('success', 'Loggedout successfully!')
    res.redirect('/campgrounds')  });
});

// campground index
app.get('/campgrounds', async (req, res) =>{
  const camps = await Campground.find({})
  res.render('campground/index', { camps })
})

app.get('/campgrounds/new',isLoggedIn, (req, res)=> {
  // if (!req.isAuthenticated()){
  //   req.flash('error', 'You must singed in')
  //   return res.redirect('/login')
  // }
  res.render('campground/new')
})

app.post('/campgrounds',isLoggedIn, async (req, res, next) => {
  try{
    const campground = new Campground(req.body.campground)
    campground.author = req.user._id;
    await campground.save()
    req.flash('success', 'Successfully made a new campground!')
    res.redirect(`/campgrounds/${campground._id}`)
  } catch(e){
    next(e);
  }
}).post(upload.single('image'), (req, res) =>{
  console.log(req.body, req.files);
  res.send('It worked!')
})


  // return (req, res, next) => {
  //   func(req, res, next).catch(next);
  // }



// Show details of campground
app.get('/campgrounds/:id', async (req, res) => {
  const { id } = req.params;
  const camp = await Campground.findById(id).populate('reviews').populate('author');
  console.log(camp)
  res.render('campground/show', {camp})
})

app.get('/campgrounds/:id/edit', async (req, res) => {
  const campground = await Campground.findById(req.params.id)
  res.render('campground/edit', {campground})
})


app.put('/campgrounds/:id', async(req, res) =>{
  const { id } = req.params;
  const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground })
  req.flash('success', 'Successfully updated the campground!')
  res.redirect(`/campgrounds/${campground._id}`)
})

app.delete('/campgrounds/:id', async(req, res) => {
  const { id } = req.params;
  await Campground.findByIdAndDelete(id);
  res.redirect('/campgrounds')
})

app.post('/campgrounds/:id/reviews', async(req, res) =>{
  const campground = await Campground.findById(req.params.id)
  const review = new Review(req.body.review)
  campground.reviews.push(review)
  review.save()
  campground.save()
  res.redirect(`/campgrounds/${campground._id}`)
})

// Delete review
app.delete('/campgrounds/:id/reviews/:reviewId', async(req, res) => {
  const {id, reviewId } = req.params;
  await Campground.findByIdAndUpdate(id, {$pull: {reviews: reviewId} })
  await Review.findByIdAndDelete(reviewId)
  res.redirect(`/campgrounds/${id}`);
})

// app.all('*', (req, res, next) => {
//   next(new ExpressError('Page Not Found', 404))
// })


// app.use((err, req, res, next) => {
//   res.send('Oh boy, something went worng!')
//   next()
// }) 