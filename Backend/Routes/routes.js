// import bcrypt from 'bcrypt'
// import express from 'express'
// import jwt from 'jsonwebtoken'
// import SignUp from '../Database/signUp.js'

// const router = express.Router()

// router.get('/', (req, res) => {
//     res.send('Hello from the API')
// })

// router.post("/signup", async (req, res) => {
// try {
// const { name, email, password, ConfirmPassword, Phone } = req.body;


// // check if passwords match
// if (password !== ConfirmPassword) {
// return res.status(400).json({ message: "Passwords do not match" });
// }


// // check if user already exists
// const existingUser = await SignUp.findOne({ email });
// if (existingUser) {
// return res.status(400).json({ message: "User already exists" });
// }


// // hash password
// const salt = await bcrypt.genSalt(10);
// const hashedPassword = await bcrypt.hash(password, salt);


// // create new user
// const newUser = new SignUp({
// name,
// email,
// password: hashedPassword,
// ConfirmPassword: hashedPassword, // store same hash for validation consistency
// Phone,
// });


// await newUser.save();
// console.log(newUser)


// // create JWT token
// const token = jwt.sign(
// { id: newUser._id, email: newUser.email },
// process.env.JWT_SECRET,
// { expiresIn: "1h" }
// );


// res.status(201).json({ message: "User registered successfully", token });
// } catch (err) {
// res.status(500).json({ message: "Server error", error: err.message });
// }
// });


// router.post("/signin", async (req, res) => {
// try {
// const { email, password } = req.body;


// // check if user exists
// const user = await SignUp.findOne({ email });
// if (!user) {
// return res.status(400).json({ message: "Invalid email or password" });
// }


// // validate password
// const isMatch = await bcrypt.compare(password, user.password);
// if (!isMatch) {
// return res.status(400).json({ message: "Invalid email or password" });
// }


// // create JWT token
// const token = jwt.sign(
// { id: user._id, email: user.email },
// process.env.JWT_SECRET,
// { expiresIn: "1h" }
// );


// res.status(200).json({ message: "Login successful", token });
// } catch (err) {
// res.status(500).json({ message: "Server error", error: err.message });
// }
// });



// export default router;

