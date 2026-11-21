import express from "express";

import pool from "../config/db.js";
import requireAuth from "../middleware/requireAuth.js";


const router =
    express.Router();


function parseId(value) {

    const id =
        Number(value);


    if (
        !Number.isInteger(id)
        || id <= 0
    ) {

        return null;

    }


    return id;

}


function handleDatabaseError(
    error,
    res,
    next
) {

    if (error.code === "23505") {

        return res
            .status(409)
            .json({
                message:
                    "Ya existe una categoría con ese nombre o slug."
            });

    }


    if (error.code === "23503") {

        return res
            .status(409)
            .json({
                message:
                    "La categoría está siendo utilizada por uno o más productos."
            });

    }


    next(error);

}


/*
|--------------------------------------------------------------------------
| GET /api/categories
|--------------------------------------------------------------------------
|
| Público.
|
*/

router.get(
    "/",
    async function(req, res, next) {

        try {

            const result =
                await pool.query(
                    `
                        SELECT
                            id,
                            name,
                            slug,
                            created_at
                        FROM categories
                        ORDER BY name ASC
                    `
                );


            res.json({
                categories:
                    result.rows,

                total:
                    result.rowCount
            });

        } catch (error) {

            next(error);

        }

    }
);


/*
|--------------------------------------------------------------------------
| GET /api/categories/:id
|--------------------------------------------------------------------------
|
| Público.
|
*/

router.get(
    "/:id",
    async function(req, res, next) {

        try {

            const id =
                parseId(
                    req.params.id
                );


            if (!id) {

                return res
                    .status(400)
                    .json({
                        message:
                            "El id de la categoría no es válido."
                    });

            }


            const result =
                await pool.query(
                    `
                        SELECT
                            id,
                            name,
                            slug,
                            created_at
                        FROM categories
                        WHERE id = $1
                    `,
                    [
                        id
                    ]
                );


            if (result.rowCount === 0) {

                return res
                    .status(404)
                    .json({
                        message:
                            "Categoría no encontrada."
                    });

            }


            res.json({
                category:
                    result.rows[0]
            });

        } catch (error) {

            next(error);

        }

    }
);


/*
|--------------------------------------------------------------------------
| POST /api/categories
|--------------------------------------------------------------------------
|
| Protegido.
|
*/

router.post(
    "/",
    requireAuth,
    async function(req, res, next) {

        try {

            const name =
                req.body.name
                    ?.trim();

            const slug =
                req.body.slug
                    ?.trim()
                    .toLowerCase();


            if (
                !name
                || !slug
            ) {

                return res
                    .status(400)
                    .json({
                        message:
                            "Los campos name y slug son obligatorios."
                    });

            }


            const result =
                await pool.query(
                    `
                        INSERT INTO categories (
                            name,
                            slug
                        )
                        VALUES (
                            $1,
                            $2
                        )
                        RETURNING
                            id,
                            name,
                            slug,
                            created_at
                    `,
                    [
                        name,
                        slug
                    ]
                );


            res
                .status(201)
                .json({
                    message:
                        "Categoría creada correctamente.",

                    category:
                        result.rows[0]
                });

        } catch (error) {

            handleDatabaseError(
                error,
                res,
                next
            );

        }

    }
);


/*
|--------------------------------------------------------------------------
| PATCH /api/categories/:id
|--------------------------------------------------------------------------
|
| Protegido.
|
*/

router.patch(
    "/:id",
    requireAuth,
    async function(req, res, next) {

        try {

            const id =
                parseId(
                    req.params.id
                );


            if (!id) {

                return res
                    .status(400)
                    .json({
                        message:
                            "El id de la categoría no es válido."
                    });

            }


            const name =
                req.body.name === undefined
                    ? null
                    : req.body.name
                        ?.trim();

            const slug =
                req.body.slug === undefined
                    ? null
                    : req.body.slug
                        ?.trim()
                        .toLowerCase();


            if (
                name === null
                && slug === null
            ) {

                return res
                    .status(400)
                    .json({
                        message:
                            "Debes enviar al menos un campo para actualizar."
                    });

            }


            if (
                name === ""
                || slug === ""
            ) {

                return res
                    .status(400)
                    .json({
                        message:
                            "name y slug no pueden estar vacíos."
                    });

            }


            const result =
                await pool.query(
                    `
                        UPDATE categories
                        SET
                            name = COALESCE($1, name),
                            slug = COALESCE($2, slug)
                        WHERE id = $3
                        RETURNING
                            id,
                            name,
                            slug,
                            created_at
                    `,
                    [
                        name,
                        slug,
                        id
                    ]
                );


            if (result.rowCount === 0) {

                return res
                    .status(404)
                    .json({
                        message:
                            "Categoría no encontrada."
                    });

            }


            res.json({
                message:
                    "Categoría actualizada correctamente.",

                category:
                    result.rows[0]
            });

        } catch (error) {

            handleDatabaseError(
                error,
                res,
                next
            );

        }

    }
);


/*
|--------------------------------------------------------------------------
| DELETE /api/categories/:id
|--------------------------------------------------------------------------
|
| Protegido.
|
*/

router.delete(
    "/:id",
    requireAuth,
    async function(req, res, next) {

        try {

            const id =
                parseId(
                    req.params.id
                );


            if (!id) {

                return res
                    .status(400)
                    .json({
                        message:
                            "El id de la categoría no es válido."
                    });

            }


            const result =
                await pool.query(
                    `
                        DELETE FROM categories
                        WHERE id = $1
                        RETURNING
                            id,
                            name,
                            slug
                    `,
                    [
                        id
                    ]
                );


            if (result.rowCount === 0) {

                return res
                    .status(404)
                    .json({
                        message:
                            "Categoría no encontrada."
                    });

            }


            res.json({
                message:
                    "Categoría eliminada correctamente.",

                category:
                    result.rows[0]
            });

        } catch (error) {

            handleDatabaseError(
                error,
                res,
                next
            );

        }

    }
);


export default router;
