import asyncHandler from '../middlewares/asyncHandler.js';
import User from '../models/userModel.js';
import bcrypt from 'bcryptjs';
import generateToken from '../utils/createToken.js';

export const createUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    throw new Error('Please fill all the inputs');
  }

  const userExist = await User.findOne({ email: email });

  if (userExist) return res.status(400).json('User already exists');

  const salt = await bcrypt.genSalt(10);

  const hashedPasword = await bcrypt.hash(password, salt);

  const newUser = new User({ username, email, password: hashedPasword });

  try {
    await newUser.save();

    generateToken(res, newUser._id);

    res.status(201).json({
      _id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      isAdmin: newUser.isAdmin,
    });
  } catch (error) {
    res.status(400);
    throw new Error('Invalid user data');
  }

  //   console.log({ username: username, email: email, password: password });
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new Error('Please fill all the inputs');
  }

  const existingUser = await User.findOne({ email: email });

  if (!existingUser) return res.status(400).json("User doesn't exists");

  if (existingUser) {
    const isPasswordValid = await bcrypt.compare(
      password,
      existingUser.password
    );

    if (isPasswordValid) {
      generateToken(res, existingUser._id);

      return res.status(201).json({
        _id: existingUser._id,
        username: existingUser.username,
        email: existingUser.email,
        isAdmin: existingUser.isAdmin,
      });
    } else {
      return res.status(401).json({
        message: 'Invalid credentials. Please check your username and password',
      });
    }
  }
});

export const logoutUser = asyncHandler(async (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
  });

  res.status(201).json({
    message: 'Logged out successfully',
  });
});

export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({});

  res.status(201).json({ users: users });
});

export const getCurrentUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    return res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

export const updateCurrentUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    const { username, email, password } = req.body;

    user.username = username || user.username;
    user.email = email || user.email;

    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);

      const hashedPasword = await bcrypt.hash(password, salt);
      user.password = hashedPasword;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

export const deleteUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);

  if (user) {
    if (user.isAdmin) {
      res.status(401);
      throw new Error("Can't delete an admin");
    }
    await User.deleteOne({ _id: user._id });
    res.json({ message: 'User removed' });
  } else {
    res.status(400);
    throw new Error('User not found');
  }
});

export const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id).select('-password');

  if (user) {
    // if (user.isAdmin) {
    //   res.status(401);
    //   throw new Error("Can't view an admin");
    // }
    res.json({ user: user });
  } else {
    res.status(400);
    throw new Error('User not found');
  }
});

export const updateUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id).select('-password');

  if (user) {
    const { username, email, isAdmin, password } = req.body;
    user.username = username || user.username;
    user.email = email || user.email;
    user.isAdmin = Boolean(isAdmin) || user.isAdmin;

    const updatedUser = await user.save();
    res.json({ user: updatedUser });
  } else {
    res.status(400);
    throw new Error('User not found');
  }
});
