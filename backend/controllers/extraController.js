const { Event, Newsletter } = require('../models/index');

// Event Controllers
exports.getEvents = async (req, res) => {
    try {
        const events = await Event.find({ active: true }).sort({ date: 1 });
        res.status(200).json(events);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch events' });
    }
};

exports.createEvent = async (req, res) => {
    try {
        const event = new Event(req.body);
        await event.save();
        res.status(201).json(event);
    } catch (err) {
        res.status(500).json({ message: 'Failed to create event' });
    }
};

// Newsletter Controller
exports.subscribeNewsletter = async (req, res) => {
    try {
        const { email } = req.body;
        const sub = new Newsletter({ email });
        await sub.save();
        res.status(201).json({ message: 'Success! You are now part of the Inner Circle.' });
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ message: 'You are already subscribed.' });
        res.status(500).json({ message: 'Subscription failed' });
    }
};
