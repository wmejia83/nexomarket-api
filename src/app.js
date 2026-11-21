import "dotenv/config";

import express from "express";
import cors from "cors";

import pool from "./config/db.js";


const app = express();


/*
|--------------------------------------------------------------------------
| CONFIGURACIÓN GENERAL
|--------------------------------------------------------------------------
*/

app.disable("x-powered-by");


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
| HEALTH CHECK
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
| 404
|--------------------------------------------------------------------------
*/

app.use(
    function(req, res) {

        res.status(404).json({
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


        res.status(500).json({
            message:
                "Ocurrió un error interno en el servidor."
        });

    }
);


export default app;
