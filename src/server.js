import "dotenv/config";

import app from "./app.js";
import pool from "./config/db.js";


const PORT =
    Number(
        process.env.PORT
        || 3000
    );


async function startServer() {

    try {

        /*
        |--------------------------------------------------------------------------
        | PREFLIGHT DE BASE DE DATOS
        |--------------------------------------------------------------------------
        |
        | Antes de iniciar Express verificamos que PostgreSQL responda.
        |
        */

        await pool.query(
            "SELECT 1"
        );


        app.listen(
            PORT,
            function() {

                console.log(
                    "========================================"
                );

                console.log(
                    "NexoMarket API"
                );

                console.log(
                    `Servidor: http://localhost:${PORT}`
                );

                console.log(
                    "PostgreSQL: conectado"
                );

                console.log(
                    "========================================"
                );

            }
        );

    } catch (error) {

        console.error(
            "No fue posible iniciar NexoMarket API."
        );

        console.error(
            error.message
        );

        process.exit(1);

    }

}


startServer();
