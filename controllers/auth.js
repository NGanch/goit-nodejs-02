const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const gravatar = require("gravatar");
const path = require("path");
const fs = require("fs/promises");
const Jimp = require("jimp");
// const {nanoid} = require("nanoid");
const { v4: uuidv4 } = require("uuid");

const { User } = require("../models/user");

const { HttpError, ctrlWrapper, sendEmail } = require("../helpers");

const { SECRET_KEY, BASE_URL } = process.env;

const avatarsDir = path.join(__dirname, "../", "public", "avatars");

const register = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user) {
    throw HttpError(409, "Email in use");
  }

  const hashPassword = await bcrypt.hash(password, 10);
  const avatarURL = gravatar.url(email);
  // const verificationCode = nanoid();
  const verificationToken = uuidv4();
  

  const newUser = await User.create({
    ...req.body,
    password: hashPassword,
    avatarURL,
    verificationToken,
  });

const verifyEmailUser = {
  to: email,
  subject: "Verify email",
  html: `<a target="_blank" href="${BASE_URL}/users/verify/${verificationToken}">Click verify email</a>`
};

await sendEmail(verifyEmailUser);

  res.status(201).json({
    user: {
      email: newUser.email,
      subscription: newUser.subscription,
    },
  });
};

const verifyEmailUser = async (req, res) => {
  const {verificationToken} = req.params;

  const user = await User.findOne({verificationToken});

  if(!user){
    throw HttpError(404, "Something went wrong, please contact support");
  }
  await User.findByIdAndUpdate(user._id, {verify: true, verificationToken: ""});

  res.json({
    message: "Email verification successful"
  })
};

const resendVerifyEmailUser = async(req, res) => {
const {email} = req.body;
const user = await User.findOne({email});
if(!user){
  throw HttpError(404, "Something went wrong, please contact support");
};

if(user.verify){
  throw HttpError(400, "Email is already verified");
}

const verifyEmailUser = {
  to: email,
  subject: "Verify email",
  html: `<a target="_blank" href="${BASE_URL}/users/verify/${user.verificationToken}">Click verify email</a>`
};

await sendEmail(verifyEmailUser);

  res.json({
    message: "Verification email has been successfully sent"
  })
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw HttpError(401, "Email or password is wrong");
  }

  if(!user.verify){
    throw HttpError(401, "Email not verified");
  }

  const passwordCompare = await bcrypt.compare(password, user.password);

  if (!passwordCompare) {
    throw HttpError(401, "Email or password is wrong");
  }

  const payload = {
    id: user._id,
  };

  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "23h" });
  await User.findByIdAndUpdate(user._id, { token });

  res.json({
    token,
    user: {
      email: user.email,
      subscription: user.subscription,
    },
  });
};

const getCurrentUser = async (req, res) => {
  const { email, subscription } = req.user;

  res.json({
    email,
    subscription,
  });
};

const logout = async (req, res) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { token: "" });

  res.status(204).send();
};

const updateAvatar = async (req, res) => {
  const { _id } = req.user;
  const { path: tempUpload, originalname } = req.file;

  const img = await Jimp.read(tempUpload);

  await img.resize(250, 250).writeAsync(tempUpload);

  const filename = `${_id}_${originalname}`;

  const resultUpload = path.join(avatarsDir, filename);

  await fs.rename(tempUpload, resultUpload);

  const avatarURL = path.join("avatars", filename);

  await User.findByIdAndUpdate(_id, { avatarURL });

  res.json({
    avatarURL,
  });
};

module.exports = {
  register: ctrlWrapper(register),
  login: ctrlWrapper(login),
  getCurrentUser: ctrlWrapper(getCurrentUser),
  logout: ctrlWrapper(logout),
  updateAvatar: ctrlWrapper(updateAvatar),
  verifyEmailUser: ctrlWrapper(verifyEmailUser),
  resendVerifyEmailUser: ctrlWrapper(resendVerifyEmailUser),
};