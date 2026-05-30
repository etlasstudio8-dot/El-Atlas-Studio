const Blog = require('../models/Blog');
const { uploadToCloudinary, deleteFromCloudinary } = require('../middleware/upload');

exports.getAllBlogs = async (req, res) => {
  try {
    const { category, status, limit = 50 } = req.query;
    let query = {};
    if (category) query.category = category;
    if (status) query.status = status;

    const blogs = await Blog.find(query).populate('author', 'name email avatar').sort({ publishDate: -1, createdAt: -1 }).limit(parseInt(limit));
    res.status(200).json({ success: true, count: blogs.length, data: blogs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching blogs', error: error.message });
  }
};

exports.getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findOne({ $or: [{ _id: req.params.id }, { slug: req.params.id }] }).populate('author', 'name email avatar avatarImg');
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
    blog.views += 1;
    await blog.save();
    res.status(200).json({ success: true, data: blog });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching blog', error: error.message });
  }
};

exports.createBlog = async (req, res) => {
  try {
    const blogData = { ...req.body, author: req.user.id };
    // Handle image: file upload takes priority, then JSON body fields
    if (req.file) {
      const upload = await uploadToCloudinary(req.file, 'el-atlas/blogs');
      blogData.featuredImage = { url: upload.url, publicId: upload.publicId };
    } else {
      const imgUrl = req.body.imageUrl || req.body.thumbnail || req.body.image || req.body.coverImage;
      if (imgUrl) blogData.featuredImage = { url: imgUrl };
    }
    const blog = await Blog.create(blogData);
    res.status(201).json({ success: true, message: 'Blog created successfully', data: blog });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating blog', error: error.message });
  }
};

exports.updateBlog = async (req, res) => {
  try {
    let blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
    if (req.file) {
      if (blog.featuredImage?.publicId) await deleteFromCloudinary(blog.featuredImage.publicId);
      const upload = await uploadToCloudinary(req.file, 'el-atlas/blogs');
      req.body.featuredImage = { url: upload.url, publicId: upload.publicId };
    } else {
      const imgUrl = req.body.imageUrl || req.body.thumbnail || req.body.image || req.body.coverImage;
      if (imgUrl) req.body.featuredImage = { url: imgUrl };
    }
    blog = await Blog.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, message: 'Blog updated successfully', data: blog });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating blog', error: error.message });
  }
};

exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
    if (blog.featuredImage?.publicId) await deleteFromCloudinary(blog.featuredImage.publicId);
    await blog.deleteOne();
    res.status(200).json({ success: true, message: 'Blog deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting blog', error: error.message });
  }
};
