function requireAuth(
    req,
    res,
    next
) {

    if (!req.session.user) {

        return res
            .status(401)
            .json({
                message:
                    "Debes iniciar sesión."
            });

    }


    next();

}


export default requireAuth;
