const handleMongooseError = (error, data, next) => {
    const { name, code } = error;
    const status = name === "MonoServerError" && code === 11000 ? 409 : 400;
    error.status = status;
    console.log(error);
    next();
  };
  
  module.exports = handleMongooseError;
