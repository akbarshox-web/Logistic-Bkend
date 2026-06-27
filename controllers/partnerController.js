import Partner from '../models/Partner.js';
import mongoose from 'mongoose';

// @desc    Get all partners
// @route   GET /api/partners
// @access  Public
const getPartners = async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      return res.json({ success: true, data: [] });
    }
    const partners = await Partner.find({}).sort({ createdAt: -1 });
    res.json({ success: true, data: partners });
  } catch (error) {
    console.error('Get partners error:', error);
    res.json({ success: true, data: [] });
  }
};

// @desc    Create a partner
// @route   POST /api/partners
// @access  Private/Admin
const createPartner = async (req, res) => {
  try {
    const { name, logo, website } = req.body;

    if (!name || !logo) {
      return res.status(400).json({ success: false, message: 'Nom va logo kiritilishi shart' });
    }

    const partner = new Partner({
      name,
      logo,
      website: website || ''
    });

    const createdPartner = await partner.save();
    res.status(201).json({ success: true, data: createdPartner });
  } catch (error) {
    console.error('Create partner error:', error);
    res.status(500).json({ success: false, message: 'Server xatoligi' });
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
      res.json({ success: true, message: 'Hamkor o\'chirildi' });
    } else {
      res.status(404).json({ success: false, message: 'Hamkor topilmadi' });
    }
  } catch (error) {
    console.error('Delete partner error:', error);
    res.status(500).json({ success: false, message: 'Server xatoligi' });
  }
};

export {
  getPartners,
  createPartner,
  deletePartner
};