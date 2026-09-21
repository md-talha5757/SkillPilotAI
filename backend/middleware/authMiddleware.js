const jwt = require('jsonwebtoken');

// This function runs BEFORE a protected route's controller.
// It checks: "did this request come with a valid login token?"
// If yes -> attaches the user's id to req.userId and lets the request continue.
// If no -> stops the request and sends back a 401 error.
function protect(req, res, next) {
  const authHeader = req.headers.authorization; // expects: "Bearer <token>"

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided, access denied' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id; // now every protected controller knows WHO is asking
    next(); // move on to the actual route logic
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

module.exports = protect;
