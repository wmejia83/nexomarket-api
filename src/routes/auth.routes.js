import express
    from "express";

import bcrypt
    from "bcryptjs";


const router =
    express.Router();


/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
*/

router.post(
    "/login",
    async function(req, res, next) {

        try {

            const {
                email,
                password
            } = req.body;


            if (
                !email
                || !password
            ) {

                return res
                    .status(400)
                    .json({
                        message:
                            "Correo y contraseña son obligatorios."
                    });

            }


            const configuredEmail =
                process.env.ADMIN_EMAIL;

            const configuredPasswordHash =
                process.env.ADMIN_PASSWORD_HASH;


            if (
                !configuredEmail
                || !configuredPasswordHash
            ) {

                return res
                    .status(500)
                    .json({
                        message:
                            "La autenticación no está configurada."
                    });

            }


            const emailMatches =
                email
                    .trim()
                    .toLowerCase()
                ===
                configuredEmail
                    .trim()
                    .toLowerCase();


            const passwordMatches =
                await bcrypt.compare(
                    password,
                    configuredPasswordHash
                );


            if (
                !emailMatches
                || !passwordMatches
            ) {

                return res
                    .status(401)
                    .json({
                        message:
                            "Credenciales incorrectas."
                    });

            }


            req.session.user = {
                email:
                    configuredEmail,

                name:
                    "Administrador"
            };


            res.json({
                message:
                    "Sesión iniciada correctamente.",

                user:
                    req.session.user
            });

        } catch (error) {

            next(error);

        }

    }
);


/*
|--------------------------------------------------------------------------
| USUARIO ACTUAL
|--------------------------------------------------------------------------
*/

router.get(
    "/me",
    function(req, res) {

        if (!req.session.user) {

            return res.json({
                authenticated:
                    false,

                user:
                    null
            });

        }


        res.json({
            authenticated:
                true,

            user:
                req.session.user
        });

    }
);


/*
|--------------------------------------------------------------------------
| LOGOUT
|--------------------------------------------------------------------------
*/

router.post(
    "/logout",
    function(req, res, next) {

        req.session.destroy(
            function(error) {

                if (error) {

                    return next(
                        error
                    );

                }


                res.clearCookie(
                    "nexomarket.sid"
                );


                res.json({
                    message:
                        "Sesión cerrada correctamente."
                });

            }
        );

    }
);


export default router;
