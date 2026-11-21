import express from "express";

const app = express();

const PORT = 3000;

// ruta get
app.get(
    "/",
    function(req,res){
        res.json({
            name: "Nexomarket",
            status: "online" 
        });
    }
);


// ruta productos
app.get(
    "/api/products",
    function(req,res){
        res.json({
            products: [
                {
                    id: 1,
                    name: "Mouse Pro",
                    price: 79000
                },
                {
                    id: 2,
                    name: "Teclado Studio",
                    price: 150000
                },
                {
                    id: 3,
                    name: "Audífonos Air",
                    price: 20000
                }
            ],
            status: "online",
            total: 3
        });
    }
)

app.get(
    "/api/products/:id",
    function(req,res){
        console.log(
            req.params,
            req.query,
            req.body
        )
    }
)

app.listen(
    PORT,
    function(){
        console.log(
            `Servidor activo en http://localhost:${PORT}`
        )
    }
);





