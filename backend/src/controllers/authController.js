// Example login handler snippet
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  // 1. Find user in database
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(400).json({ message: 'Invalid credentials.' });

  // 2. Verify password with bcrypt
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) return res.status(400).json({ message: 'Invalid credentials.' });

  // 3. Issue Token containing User Role
  const token = jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role
    }
  });
};