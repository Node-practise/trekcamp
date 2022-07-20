// Calling mongoose library
const mongoose = require('mongoose');
// calling schema
const Schema = mongoose.Schema;

// 
const reviewSchema = new Schema({
  body: String,
  rating: Number
})

module.exports = mongoose.model('Review', reviewSchema);