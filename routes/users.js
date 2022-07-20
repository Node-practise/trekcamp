const express = require('express')
const router = express.Router()
const User = require('../model/user')

router.get('/registers', (req, res) =>{
  res.render('users/register')
})

module.exports = router;