const express = require('express');
const multer = require('multer');
const Post = require('../models/Post');
const auth = require('../middleware/auth');

const router = express.Router();
const upload = multer({ dest: 'uploads/' }); // for local storage

// create post
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const { title, body, tags } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
    const post = await Post.create({
      title, body, tags: tags ? tags.split(',').map(t => t.trim()) : [],
      imageUrl, author: req.user._id
    });
    res.json(post);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// list posts
router.get('/', async (req, res) => {
  const posts = await Post.find().populate('author', 'name').sort({ createdAt: -1 });
  res.json(posts);
});

// read post
router.get('/:id', async (req, res) => {
  const post = await Post.findById(req.params.id).populate('author', 'name');
  if (!post) return res.status(404).json({ message: 'Not found' });
  res.json(post);
});

// update post
router.put('/:id', auth, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Not found' });
  if (post.author.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Forbidden' });
  Object.assign(post, req.body);
  await post.save();
  res.json(post);
});

// delete
router.delete('/:id', auth, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Not found' });
  if (post.author.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Forbidden' });
  await post.remove();
  res.json({ message: 'Deleted' });
});

module.exports = router;
