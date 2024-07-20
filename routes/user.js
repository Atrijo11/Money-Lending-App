const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { expressjwt: expressJwt } = require('express-jwt');

// Helper function to calculate age
const calculateAge = (dob) => {
    const diff = Date.now() - dob.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
};

// Helper function to calculate Purchase Power amount
const calculatePurchasePower = (monthlySalary) => {
    // Example calculation: 20% of the monthly salary
    return monthlySalary * 0.2;
};

// Helper function to calculate monthly repayment
const calculateMonthlyRepayment = (borrowedAmount, tenure, interestRate) => {
    const monthlyInterestRate = interestRate / 12 / 100;
    const monthlyRepayment = (borrowedAmount * monthlyInterestRate) / (1 - Math.pow(1 + monthlyInterestRate, -tenure));
    return monthlyRepayment;
};

// Middleware to protect routes
const auth = expressJwt({ secret: 'your_jwt_secret', algorithms: ['HS256'] });

// POST /signup
router.post('/signup', async (req, res) => {
    const { phoneNumber, email, name, dob, monthlySalary, password } = req.body;

    // Validate user age
    const age = calculateAge(new Date(dob));
    if (age <= 20) {
        return res.status(400).json({ message: 'User should be above 20 years of age' });
    }

    // Validate monthly salary
    if (monthlySalary < 25000) {
        return res.status(400).json({ message: 'Monthly salary should be 25k or more' });
    }

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ phoneNumber });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this phone number already exists' });
        }

        // Create new user
        const newUser = new User({
            phoneNumber,
            email,
            name,
            dob,
            monthlySalary,
            status: 'Approved',
            password
        });

        await newUser.save();
        res.status(201).json({ message: 'User registered successfully', user: newUser });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// POST /login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Create JWT payload
        const payload = {
            user: {
                id: user.id,
                email: user.email
            }
        };

        // Sign JWT
        jwt.sign(
            payload,
            'your_jwt_secret',
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );

    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// GET /user
router.get('/user', auth, async (req, res) => {
    try {
        // Fetch user data
        const user = await User.findById(req.auth.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Calculate Purchase Power amount
        const purchasePower = calculatePurchasePower(user.monthlySalary);

        // Return user data
        res.json({
            purchasePower,
            phoneNumber: user.phoneNumber,
            email: user.email,
            dateOfRegistration: user.dateOfRegistration,
            dob: user.dob,
            monthlySalary: user.monthlySalary
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// POST /borrow
router.post('/borrow', auth, async (req, res) => {
    const { amount, tenure } = req.body; // tenure in months

    try {
        // Fetch user data
        const user = await User.findById(req.auth.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Calculate Purchase Power amount
        const purchasePower = calculatePurchasePower(user.monthlySalary) - user.borrowedAmount;

        // Check if the requested amount is within the Purchase Power
        if (amount > purchasePower) {
            return res.status(400).json({ message: 'Requested amount exceeds Purchase Power' });
        }

        // Update borrowed amount
        user.borrowedAmount += amount;
        await user.save();

        // Calculate monthly repayment
        const monthlyRepayment = calculateMonthlyRepayment(amount, tenure, 8);

        // Return updated Purchase Power and monthly repayment
        res.json({
            purchasePower: purchasePower - amount,
            monthlyRepayment
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

module.exports = router;
