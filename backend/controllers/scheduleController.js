const { Schedule, Course, Membership } = require('../models/index');

// Create a Schedule (Staff)
exports.createSchedule = async (req, res) => {
    try {
        console.log('Creating schedule with data:', req.body);
        console.log('User creating schedule:', req.user);
        
        const { courseID, membershipID, title, startTime, duration, meetingLink } = req.body;

        // Clean up empty string values
        const cleanCourseID = courseID && courseID.trim() !== '' ? courseID.trim() : null;
        const cleanMembershipID = membershipID && membershipID.trim() !== '' ? membershipID.trim() : null;

        // Validate that either courseID or membershipID is provided
        if (!cleanCourseID && !cleanMembershipID) {
            return res.status(400).json({ message: 'Either courseID or membershipID must be provided' });
        }

        // Validate required fields
        if (!title || !startTime) {
            return res.status(400).json({ message: 'Title and startTime are required' });
        }

        // Ensure duration is a number
        const durationMinutes = typeof duration === 'string' ? parseInt(duration, 10) : (duration || 60);
        
        // Calculate endTime from startTime + duration (in minutes)
        const start = new Date(startTime);
        const end = new Date(start.getTime() + durationMinutes * 60000);

        console.log('Calculated times:', { start, end, durationMinutes });

        const scheduleData = {
            staffID: req.user.id,
            title,
            startTime: start,
            endTime: end,
            expectedDuration: durationMinutes,
            meetingLink,
            type: 'Live', // Default to Live for live class scheduling
            approvalStatus: 'Approved' // Auto-approve all live classes
        };

        // Only add courseID or membershipID if they are provided
        if (cleanCourseID) {
            scheduleData.courseID = cleanCourseID;
        }
        if (cleanMembershipID) {
            scheduleData.membershipID = cleanMembershipID;
        }

        console.log('Schedule data to save:', scheduleData);

        const newSchedule = new Schedule(scheduleData);
        
        // Validate the document before saving
        const validationError = newSchedule.validateSync();
        if (validationError) {
            console.error('Validation error:', validationError);
            return res.status(400).json({ 
                message: 'Validation failed', 
                error: validationError.message || 'Invalid schedule data'
            });
        }
        
        await newSchedule.save();
        
        console.log('Schedule created successfully:', newSchedule);
        
        res.status(201).json({ message: 'Schedule created successfully', schedule: newSchedule });
    } catch (err) {
        console.error('Error creating schedule:', err);
        console.error('Stack trace:', err.stack);
        res.status(500).json({ message: 'Failed to create schedule', error: err.message });
    }
};

// Get Schedules for a Course (Shared)
exports.getCourseSchedules = async (req, res) => {
    try {
        const schedules = await Schedule.find({ courseID: req.params.courseID }).sort({ startTime: 1 });
        
        // Hide meeting link from students
        if (req.user.role === 'Student') {
            const sanitizedSchedules = schedules.map(schedule => {
                const scheduleObj = schedule.toObject();
                delete scheduleObj.meetingLink;
                return scheduleObj;
            });
            return res.status(200).json(sanitizedSchedules);
        }
        
        res.status(200).json(schedules);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch schedules', error: err.message });
    }
};

// Get Schedules for a Membership (Shared)
exports.getMembershipSchedules = async (req, res) => {
    try {
        const schedules = await Schedule.find({ membershipID: req.params.membershipID })
            .populate('staffID', 'name')
            .sort({ startTime: 1 });
        
        // Hide meeting link from students
        if (req.user.role === 'Student') {
            const sanitizedSchedules = schedules.map(schedule => {
                const scheduleObj = schedule.toObject();
                delete scheduleObj.meetingLink;
                return scheduleObj;
            });
            return res.status(200).json(sanitizedSchedules);
        }
        
        res.status(200).json(schedules);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch membership schedules', error: err.message });
    }
};

// Get All Schedules for Student/Staff
exports.getMyTimetable = async (req, res) => {
    try {
        const { User, Course, Membership } = require('../models/index');
        const user = await User.findById(req.user.id);

        let courseIDs = [];
        let membershipIDs = [];
        
        if (user.role === 'Student') {
            courseIDs = user.enrolledCourses || [];
            membershipIDs = user.enrolledMemberships || [];
        } else if (user.role === 'Staff') {
            const myCourses = await Course.find({ mentors: req.user.id });
            courseIDs = myCourses.map(c => c._id);
            
            const myMemberships = await Membership.find({ mentors: req.user.id });
            membershipIDs = myMemberships.map(m => m._id);
        } else if (user.role === 'Admin') {
            const allCourses = await Course.find();
            courseIDs = allCourses.map(c => c._id);
            
            const allMemberships = await Membership.find();
            membershipIDs = allMemberships.map(m => m._id);
        }

        const schedules = await Schedule.find({
            $or: [
                { courseID: { $in: courseIDs } },
                { membershipID: { $in: membershipIDs } }
            ]
        }).populate('courseID', 'title')
          .populate('membershipID', 'packageName')
          .populate('staffID', 'name')
          .sort({ startTime: 1 });

        // Hide meeting link from students
        if (user.role === 'Student') {
            const sanitizedSchedules = schedules.map(schedule => {
                const scheduleObj = schedule.toObject();
                delete scheduleObj.meetingLink;
                return scheduleObj;
            });
            return res.status(200).json(sanitizedSchedules);
        }

        res.status(200).json(schedules);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch timetable', error: err.message });
    }
};

// Update Schedule Status (Admin Only)
exports.updateScheduleStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'Approved', 'Rejected', etc.

        if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const schedule = await Schedule.findByIdAndUpdate(
            id,
            { approvalStatus: status },
            { new: true }
        );

        if (!schedule) {
            return res.status(404).json({ message: 'Schedule not found' });
        }

        res.status(200).json({ message: `Schedule marked as ${status}`, schedule });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update schedule status', error: err.message });
    }
};

// Update Schedule (Admin Only)
exports.updateSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, startTime, duration, meetingLink } = req.body;

        const schedule = await Schedule.findById(id);
        if (!schedule) {
            return res.status(404).json({ message: 'Schedule not found' });
        }

        // Update fields
        if (title) schedule.title = title;
        if (startTime) {
            schedule.startTime = new Date(startTime);
            // Recalculate endTime if duration provided or use existing
            const durationToUse = duration || schedule.expectedDuration;
            schedule.endTime = new Date(schedule.startTime.getTime() + durationToUse * 60000);
        }
        if (duration) {
            schedule.expectedDuration = duration;
            // Recalculate endTime
            schedule.endTime = new Date(schedule.startTime.getTime() + duration * 60000);
        }
        if (meetingLink !== undefined) schedule.meetingLink = meetingLink;

        await schedule.save();
        res.status(200).json({ message: 'Schedule updated successfully', schedule });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update schedule', error: err.message });
    }
};

// Delete Schedule (Admin Only)
exports.deleteSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('Delete request received for schedule ID:', id);

        // Validate ObjectId format
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(id)) {
            console.log('Invalid ObjectId format:', id);
            return res.status(400).json({ message: 'Invalid schedule ID format' });
        }

        const schedule = await Schedule.findByIdAndDelete(id);
        console.log('Schedule found and deleted:', schedule ? 'Yes' : 'No');

        if (!schedule) {
            return res.status(404).json({ message: 'Schedule not found' });
        }

        res.status(200).json({ message: 'Schedule deleted successfully' });
    } catch (err) {
        console.error('Delete schedule error:', err);
        res.status(500).json({ message: 'Failed to delete schedule', error: err.message });
    }
};

// Update Own Schedule (Staff - within 5 minutes)
exports.updateOwnSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, startTime, duration, meetingLink, courseID, membershipID } = req.body;

        const schedule = await Schedule.findById(id);
        if (!schedule) {
            return res.status(404).json({ message: 'Schedule not found' });
        }

        // Check if user owns this schedule
        if (schedule.staffID.toString() !== req.user.id) {
            return res.status(403).json({ message: 'You can only edit your own schedules' });
        }

        // Check if schedule was created within the last 5 minutes
        const now = new Date();
        const createdAt = schedule.createdAt || schedule._id.getTimestamp();
        const timeDiff = (now - createdAt) / (1000 * 60); // difference in minutes

        if (timeDiff > 5) {
            return res.status(403).json({ 
                message: 'Schedule can only be edited within 5 minutes of creation',
                timeRemaining: Math.max(0, 5 - timeDiff)
            });
        }

        // Update fields
        if (title) schedule.title = title;
        if (startTime) {
            schedule.startTime = new Date(startTime);
            const durationToUse = duration || schedule.expectedDuration;
            schedule.endTime = new Date(schedule.startTime.getTime() + durationToUse * 60000);
        }
        if (duration) {
            schedule.expectedDuration = duration;
            schedule.endTime = new Date(schedule.startTime.getTime() + duration * 60000);
        }
        if (meetingLink !== undefined) schedule.meetingLink = meetingLink;
        
        // Update course/membership if provided
        if (courseID !== undefined) {
            schedule.courseID = courseID || null;
            if (!courseID) schedule.membershipID = membershipID || null;
        }
        if (membershipID !== undefined) {
            schedule.membershipID = membershipID || null;
            if (!membershipID) schedule.courseID = courseID || null;
        }

        await schedule.save();
        res.status(200).json({ message: 'Schedule updated successfully', schedule });
    } catch (err) {
        console.error('Update own schedule error:', err);
        res.status(500).json({ message: 'Failed to update schedule', error: err.message });
    }
};

// Delete Own Schedule (Staff - no time limit)
exports.deleteOwnSchedule = async (req, res) => {
    try {
        const { id } = req.params;

        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid schedule ID format' });
        }

        const schedule = await Schedule.findById(id);
        if (!schedule) {
            return res.status(404).json({ message: 'Schedule not found' });
        }

        // Check if user owns this schedule
        if (schedule.staffID.toString() !== req.user.id) {
            return res.status(403).json({ message: 'You can only delete your own schedules' });
        }

        await Schedule.findByIdAndDelete(id);
        res.status(200).json({ message: 'Schedule deleted successfully' });
    } catch (err) {
        console.error('Delete own schedule error:', err);
        res.status(500).json({ message: 'Failed to delete schedule', error: err.message });
    }
};
