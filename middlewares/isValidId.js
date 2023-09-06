const { isValidObjectId } = require("mongoose");

const { HttpError } = require("../helpers");
const isValidId = (req, res, next) => {
  try {
    const { contactId } = req.params;
    if (!isValidObjectId(contactId)) {
      // next(HttpError(400, 'is not a valid id'))
      throw HttpError(404, `not found`);
    }
    next();
  } catch (error) {
    next(error);
  }
};
module.exports = isValidId;