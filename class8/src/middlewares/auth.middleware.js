import jwt from "jsonwebtoken";

export function authenticateToken(req,res,next){
    const token = req.cookies?.token;

    if(!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try{
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next()
    }catch(err){
        res.status(401).json({
            message:"Invalid Token",
            err: err.message
        })
    }

}
export function requireAdmin(req,res,next){
    if(req.user?.role !== "admin"){
        return res.status(403).json({
            message:"Forbidden"
        })
    }
    next()
}

export function authorizeRoles(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: "You do not have permission to perform this action." });
        }
        return next();
    };
}
