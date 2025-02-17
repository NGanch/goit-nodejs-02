const express = require('express')
const logger = require('morgan')
const cors = require('cors')
// const dotenv = require('dotenv');
require('dotenv').config();

const usersRouter = require("./routes/api/auth");
// const authRouter = require('./routes/api/auth')
const contactsRouter = require('./routes/api/contacts')

// dotenv.config()
const app = express()

const formatsLogger = app.get('env') === 'development' ? 'dev' : 'short'

app.use(logger(formatsLogger))
// викликаємо cors
app.use(cors())
app.use(express.json())
// виддає фображення на фронтенд-прописуємо шлях до файлу(папка public)
app.use(express.static("public"));

app.use('/users', usersRouter)
app.use('/api/contacts', contactsRouter)

app.use((req, res) => {
  res.status(404).json({ message: 'Not found' })
})

app.use((err, req, res, next) => {
  const {status = 500, message = "Server error"} = err;
  res.status(status).json({ message, });
})

module.exports = app;
