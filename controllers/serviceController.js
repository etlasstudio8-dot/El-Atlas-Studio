const Service = require('../models/Service');
const { uploadToCloudinary, deleteFromCloudinary } = require('../middleware/upload');

exports.getAllServices = async (req, res) => {
  try {
    const { category, status, limit = 50 } = req.query;
    let query = {};
    if (category) query.category = category;
    if (status) query.status = status;

    const services = await Service.find(query).populate('createdBy', 'name email').sort({ isFeatured: -1, order: 1 }).limit(parseInt(limit));
    res.status(200).json({ success: true, count: services.length, data: services });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching services', error: error.message });
  }
};

exports.getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id).populate('createdBy', 'name email');
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    res.status(200).json({ success: true, data: service });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching service', error: error.message });
  }
};

exports.createService = async (req, res) => {
  try {
    const serviceData = { ...req.body, createdBy: req.user.id };
    if (req.file) {
      const upload = await uploadToCloudinary(req.file, 'el-atlas/services');
      serviceData.image = { url: upload.url, publicId: upload.publicId };
    }
    const service = await Service.create(serviceData);
    res.status(201).json({ success: true, message: 'Service created successfully', data: service });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating service', error: error.message });
  }
};

exports.updateService = async (req, res) => {
  try {
    let service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    if (req.file) {
      if (service.image?.publicId) await deleteFromCloudinary(service.image.publicId);
      const upload = await uploadToCloudinary(req.file, 'el-atlas/services');
      req.body.image = { url: upload.url, publicId: upload.publicId };
    }
    req.body.updatedBy = req.user.id;
    service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, message: 'Service updated successfully', data: service });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating service', error: error.message });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    if (service.image?.publicId) await deleteFromCloudinary(service.image.publicId);
    await service.deleteOne();
    res.status(200).json({ success: true, message: 'Service deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting service', error: error.message });
  }
};
