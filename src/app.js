import "dotenv/config";

import express from "express";
import cors from "cors";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";

import pool from "./config/db.js";

import authRouter from "./routes/auth.routes.js";
import categoryRouter from "./routes/category.routes.js";


const app =
    express();


const PostgreSqlSessionStore =
    connectPgSimple(
        session
    );


app.disable(
    "x-powered-by"
);


/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/

app.use(
    cors({
        origin:
            process.env.FRONTEND_ORIGIN
            || "http://localhost:5173",

        credentials:
            true
    })
);


/*
|--------------------------------------------------------------------------
| JSON
|--------------------------------------------------------------------------
*/

app.use(
    express.json()
);


/*
|--------------------------------------------------------------------------
| SESIONES
|--------------------------------------------------------------------------
*/

app.use(
    session({

        name:
            "nexomarket.sid",

        store:
            new PostgreSqlSessionStore({
                pool:
                    pool,

                tableName:
                    "user_sessions",

                createTableIfMissing:
                    true
            }),

        secret:
            process.env.SESSION_SECRET,

        resave:
            false,

        saveUninitialized:
            false,

        cookie: {

            httpOnly:
                true,

            sameSite:
                "lax",

            secure:
                process.env.NODE_ENV
                === "production",

            maxAge:
                1000
                * 60
                * 60
                * 8
        }

    })
);


/*
|--------------------------------------------------------------------------
| HOME
|--------------------------------------------------------------------------
*/

app.get(
    "/",
    function(req, res) {

        res.json({
            name:
                "NexoMarket API",

            status:
                "online"
        });

    }
);


/*
|--------------------------------------------------------------------------
| HEALTH
|--------------------------------------------------------------------------
*/

app.get(
    "/api/health",
    async function(req, res, next) {

        try {

            const result =
                await pool.query(
                    "SELECT NOW() AS database_time"
                );


            res.json({
                status:
                    "ok",

                app:
                    "NexoMarket API",

                database:
                    "connected",

                database_time:
                    result.rows[0].database_time
            });

        } catch (error) {

            next(error);

        }

    }
);


/*
|--------------------------------------------------------------------------
| AUTH
|--------------------------------------------------------------------------
*/

app.use(
    "/api/auth",
    authRouter
);

/*
|--------------------------------------------------------------------------
| CATEGORIES
|--------------------------------------------------------------------------
*/

app.use(
    "/api/categories",
    categoryRouter
);


/*
|--------------------------------------------------------------------------
| 404
|--------------------------------------------------------------------------
*/

app.use(
    function(req, res) {

        res
            .status(404)
            .json({
                message:
                    "Endpoint no encontrado."
            });

    }
);


/*
|--------------------------------------------------------------------------
| ERROR HANDLER
|--------------------------------------------------------------------------
*/

app.use(
    function(error, req, res, next) {

        console.error(
            "API ERROR:",
            error.message
        );


        res
            .status(500)
            .json({
                message:
                    "Ocurrió un error interno en el servidor."
            });

    }
);


export default app;
