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

    if (error.code === "23503") {

        return res
            .status(400)
            .json({
                message:
                    "La categoría seleccionada no existe."
            });
    }


    if (error.code === "23514") {

        return res
            .status(400)
            .json({
                message:
                    "Alguno de los valores del producto no es válido."
            });
    }


    next(error);
}


/*
|--------------------------------------------------------------------------
| GET /api/products
|--------------------------------------------------------------------------
|
| Público.
|
| Admite:
|
| ?search=mouse
| ?category_id=1
|
*/

router.get(
    "/",
    async function(req, res, next) {

        try {

            const search =
                req.query.search
                    ?.trim()
                    || null;


            const categoryId =
                req.query.category_id
                    ? parseId(
                        req.query.category_id
                    )
                    : null;


            if (
                req.query.category_id
                && !categoryId
            ) {

                return res
                    .status(400)
                    .json({
                        message:
                            "category_id no es válido."
                    });
            }


            const conditions = [];
            const values = [];


            if (search) {

                values.push(
                    `%${search}%`
                );

                conditions.push(
                    `
                        (
                            LOWER(products.name)
                            LIKE LOWER($${values.length})
                            OR
                            LOWER(
                                COALESCE(
                                    products.description,
                                    ''
                                )
                            )
                            LIKE LOWER($${values.length})
                        )
                    `
                );
            }


            if (categoryId) {

                values.push(
                    categoryId
                );

                conditions.push(
                    `
                        products.category_id
                        = $${values.length}
                    `
                );
            }


            const where =
                conditions.length > 0
                    ? "WHERE "
                        + conditions.join(" AND ")
                    : "";


            const result =
                await pool.query(
                    `
                        SELECT
                            products.id,
                            products.name,
                            products.description,
                            products.price,
                            products.stock,
                            products.image_url,
                            products.active,
                            products.category_id,
                            categories.name
                                AS category,
                            categories.slug
                                AS category_slug,
                            products.created_at
                        FROM products
                        INNER JOIN categories
                            ON categories.id
                            = products.category_id
                        ${where}
                        ORDER BY
                            products.created_at DESC,
                            products.id DESC
                    `,
                    values
                );


            res.json({
                products:
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
| GET /api/products/:id
|--------------------------------------------------------------------------
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
                            "El id del producto no es válido."
                    });
            }


            const result =
                await pool.query(
                    `
                        SELECT
                            products.id,
                            products.name,
                            products.description,
                            products.price,
                            products.stock,
                            products.image_url,
                            products.active,
                            products.category_id,
                            categories.name
                                AS category,
                            categories.slug
                                AS category_slug,
                            products.created_at
                        FROM products
                        INNER JOIN categories
                            ON categories.id
                            = products.category_id
                        WHERE products.id = $1
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
                            "Producto no encontrado."
                    });
            }


            res.json({
                product:
                    result.rows[0]
            });

        } catch (error) {

            next(error);
        }

    }
);


/*
|--------------------------------------------------------------------------
| POST /api/products
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

            const description =
                req.body.description
                    ?.trim()
                    || null;

            const price =
                Number(
                    req.body.price
                );

            const stock =
                req.body.stock === undefined
                    ? 0
                    : Number(
                        req.body.stock
                    );

            const imageUrl =
                req.body.image_url
                    ?.trim()
                    || null;

            const categoryId =
                Number(
                    req.body.category_id
                );

            const active =
                req.body.active === undefined
                    ? true
                    : req.body.active;


            if (!name) {

                return res
                    .status(400)
                    .json({
                        message:
                            "El nombre es obligatorio."
                    });
            }


            if (
                !Number.isFinite(price)
                || price < 0
            ) {

                return res
                    .status(400)
                    .json({
                        message:
                            "El precio no es válido."
                    });
            }


            if (
                !Number.isInteger(stock)
                || stock < 0
            ) {

                return res
                    .status(400)
                    .json({
                        message:
                            "El stock no es válido."
                    });
            }


            if (
                !Number.isInteger(categoryId)
                || categoryId <= 0
            ) {

                return res
                    .status(400)
                    .json({
                        message:
                            "La categoría no es válida."
                    });
            }


            if (
                typeof active !== "boolean"
            ) {

                return res
                    .status(400)
                    .json({
                        message:
                            "active debe ser true o false."
                    });
            }


            const result =
                await pool.query(
                    `
                        WITH inserted AS (
                            INSERT INTO products (
                                name,
                                description,
                                price,
                                stock,
                                image_url,
                                active,
                                category_id
                            )
                            VALUES (
                                $1,
                                $2,
                                $3,
                                $4,
                                $5,
                                $6,
                                $7
                            )
                            RETURNING *
                        )
                        SELECT
                            inserted.id,
                            inserted.name,
                            inserted.description,
                            inserted.price,
                            inserted.stock,
                            inserted.image_url,
                            inserted.active,
                            inserted.category_id,
                            categories.name
                                AS category,
                            categories.slug
                                AS category_slug,
                            inserted.created_at
                        FROM inserted
                        INNER JOIN categories
                            ON categories.id
                            = inserted.category_id
                    `,
                    [
                        name,
                        description,
                        price,
                        stock,
                        imageUrl,
                        active,
                        categoryId
                    ]
                );


            res
                .status(201)
                .json({
                    message:
                        "Producto creado correctamente.",

                    product:
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
| PATCH /api/products/:id
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
                            "El id del producto no es válido."
                    });
            }


            const name =
                req.body.name === undefined
                    ? null
                    : req.body.name
                        ?.trim();


            const description =
                req.body.description === undefined
                    ? null
                    : String(
                        req.body.description
                    ).trim();


            const price =
                req.body.price === undefined
                    ? null
                    : Number(
                        req.body.price
                    );


            const stock =
                req.body.stock === undefined
                    ? null
                    : Number(
                        req.body.stock
                    );


            const imageUrl =
                req.body.image_url === undefined
                    ? null
                    : String(
                        req.body.image_url
                    ).trim();


            const active =
                req.body.active === undefined
                    ? null
                    : req.body.active;


            const categoryId =
                req.body.category_id === undefined
                    ? null
                    : Number(
                        req.body.category_id
                    );


            if (
                name === null
                && description === null
                && price === null
                && stock === null
                && imageUrl === null
                && active === null
                && categoryId === null
            ) {

                return res
                    .status(400)
                    .json({
                        message:
                            "Debes enviar al menos un campo para actualizar."
                    });
            }


            if (name === "") {

                return res
                    .status(400)
                    .json({
                        message:
                            "El nombre no puede estar vacío."
                    });
            }


            if (
                price !== null
                && (
                    !Number.isFinite(price)
                    || price < 0
                )
            ) {

                return res
                    .status(400)
                    .json({
                        message:
                            "El precio no es válido."
                    });
            }


            if (
                stock !== null
                && (
                    !Number.isInteger(stock)
                    || stock < 0
                )
            ) {

                return res
                    .status(400)
                    .json({
                        message:
                            "El stock no es válido."
                    });
            }


            if (
                categoryId !== null
                && (
                    !Number.isInteger(categoryId)
                    || categoryId <= 0
                )
            ) {

                return res
                    .status(400)
                    .json({
                        message:
                            "La categoría no es válida."
                    });
            }


            if (
                active !== null
                && typeof active !== "boolean"
            ) {

                return res
                    .status(400)
                    .json({
                        message:
                            "active debe ser true o false."
                    });
            }


            const result =
                await pool.query(
                    `
                        WITH updated AS (
                            UPDATE products
                            SET
                                name =
                                    COALESCE(
                                        $1,
                                        name
                                    ),

                                description =
                                    COALESCE(
                                        $2,
                                        description
                                    ),

                                price =
                                    COALESCE(
                                        $3,
                                        price
                                    ),

                                stock =
                                    COALESCE(
                                        $4,
                                        stock
                                    ),

                                image_url =
                                    COALESCE(
                                        $5,
                                        image_url
                                    ),

                                active =
                                    COALESCE(
                                        $6,
                                        active
                                    ),

                                category_id =
                                    COALESCE(
                                        $7,
                                        category_id
                                    )

                            WHERE id = $8

                            RETURNING *
                        )

                        SELECT
                            updated.id,
                            updated.name,
                            updated.description,
                            updated.price,
                            updated.stock,
                            updated.image_url,
                            updated.active,
                            updated.category_id,
                            categories.name
                                AS category,
                            categories.slug
                                AS category_slug,
                            updated.created_at

                        FROM updated

                        INNER JOIN categories
                            ON categories.id
                            = updated.category_id
                    `,
                    [
                        name,
                        description,
                        price,
                        stock,
                        imageUrl,
                        active,
                        categoryId,
                        id
                    ]
                );


            if (result.rowCount === 0) {

                return res
                    .status(404)
                    .json({
                        message:
                            "Producto no encontrado."
                    });
            }


            res.json({
                message:
                    "Producto actualizado correctamente.",

                product:
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
| DELETE /api/products/:id
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
                            "El id del producto no es válido."
                    });
            }


            const result =
                await pool.query(
                    `
                        DELETE FROM products
                        WHERE id = $1
                        RETURNING
                            id,
                            name,
                            category_id
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
                            "Producto no encontrado."
                    });
            }


            res.json({
                message:
                    "Producto eliminado correctamente.",

                product:
                    result.rows[0]
            });

        } catch (error) {

            next(error);
        }

    }
);


export default router;
