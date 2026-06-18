import Partner from '../models/Partner.js';
import mongoose from 'mongoose';

// @desc    Get all partners
// @route   GET /api/partners
// @access  Public
const getPartners = async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      res.json([]);
      return;
    }
    const partners = await Partner.find({});
    res.json(partners);
  } catch (error) {
    res.json([]);
  }
};

// @desc    Create a partner
// @route   POST /api/partners
// @access  Private/Admin
const createPartner = async (req, res) => {
  try {
    const { name, logo, website } = req.body;

    const partner = new Partner({
      name,
      logo,
      website
    });

    const createdPartner = await partner.save();
    res.status(201).json(createdPartner);
  } catch (error) {
    res.status(500).json({ message: 'Server xatoligi' });
  }
};

// @desc    Delete a partner
// @route   DELETE /api/partners/:id
// @access  Private/Admin
const deletePartner = async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);

    if (partner) {
      await Partner.deleteOne({ _id: partner._id });
      res.json({ message: 'Hamkor o\'chirildi' });
    } else {
      res.status(404).json({ message: 'Hamkor topilmadi' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server xatoligi' });
  }
};

export {
  getPartners,
  createPartner,
  deletePartner
};
