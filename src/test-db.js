import "dotenv/config";


import pool
    from "./config/db.js";


try {

    const result =
        await pool.query(
            "SELECT NOW() AS current_time"
        );


    console.log(
        "Base de datos conectada"
    );


    console.log(
        result.rows[0]
    );


} catch (error) {

    console.error(
        "Error al conectar:",
        error.message
    );


} finally {

    await pool.end();

}