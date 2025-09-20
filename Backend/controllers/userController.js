
import User from "../Models/User.js";

export const createOrUpdateUser = async (req, res) => {
  try {
    const { sub, email, nickname, name } = req.auth.payload; // From Auth0 token
    let user = await User.findOne({ auth0Id: sub });

    if (!user) {
      user = await User.create({
        auth0Id: sub,
        email,
        username: nickname,
        fullname: name
      });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findOne({ auth0Id: req.auth.sub });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};





